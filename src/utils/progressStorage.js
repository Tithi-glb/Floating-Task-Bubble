// ─── Progress History Storage ────────────────────────────────────────────────
// Stores daily productivity snapshots in localStorage so the ProgressTracker
// can show historical charts and trend data across sessions.

const PROGRESS_HISTORY_KEY = "ftb_progress_history";

/**
 * Load all stored daily snapshots.
 * Returns an object keyed by ISO date string: { "2026-07-17": { ... }, ... }
 */
export function loadProgressHistory() {
  try {
    const raw = localStorage.getItem(PROGRESS_HISTORY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Save updated history object back to localStorage.
 */
export function saveProgressHistory(history) {
  try {
    localStorage.setItem(PROGRESS_HISTORY_KEY, JSON.stringify(history));
  } catch {
    // Ignore quota errors
  }
}

/**
 * Upsert (create or update) the snapshot for a specific date.
 * @param {string} dateString - ISO date "YYYY-MM-DD"
 * @param {object} snapshot   - { completed, pending, overdue, completionPercentage }
 */
export function upsertDaySnapshot(dateString, snapshot) {
  const history = loadProgressHistory();
  history[dateString] = { date: dateString, ...snapshot };
  saveProgressHistory(history);
}

/**
 * Get a single day's snapshot, or null if not found.
 */
export function getDaySnapshot(dateString) {
  const history = loadProgressHistory();
  return history[dateString] || null;
}

/**
 * Get snapshots for the last N days (including today).
 * Returns array sorted oldest → newest.
 */
export function getLastNDaysSnapshots(n = 7) {
  const history = loadProgressHistory();
  const results = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    results.push(history[dateStr] || { date: dateStr, completed: 0, pending: 0, overdue: 0, completionPercentage: 0 });
  }
  return results;
}

/**
 * Derive and persist today's snapshot from the current tasks array.
 * Should be called whenever tasks change.
 */
export function syncTodaySnapshot(tasks) {
  const today = new Date().toISOString().split("T")[0];
  const todayTasks = tasks.filter((t) => t.dueDate === today);
  const completed = todayTasks.filter((t) => t.completed).length;
  const total = todayTasks.length;
  const now = new Date();

  const overdue = tasks.filter((t) => {
    if (t.completed || !t.dueDate || !t.time) return false;
    const dl = new Date(`${t.dueDate}T${t.time}:00`);
    return !isNaN(dl) && dl < now;
  }).length;

  const pending = total - completed;
  const completionPercentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  upsertDaySnapshot(today, { completed, pending, overdue, completionPercentage });
}

/**
 * Compute a productivity score (0–100) based on completion rate,
 * streak, and overdue tasks.
 * @param {object[]} snapshots - array of day snapshots
 */
export function computeProductivityScore(snapshots) {
  if (!snapshots || snapshots.length === 0) return 0;

  const recentSnapshots = snapshots.slice(-7); // last 7 days
  const avgCompletion =
    recentSnapshots.reduce((sum, s) => sum + (s.completionPercentage || 0), 0) /
    recentSnapshots.length;

  // Streak bonus (up to 20 pts)
  let streak = 0;
  for (let i = recentSnapshots.length - 1; i >= 0; i--) {
    if ((recentSnapshots[i].completionPercentage || 0) >= 50) streak++;
    else break;
  }
  const streakBonus = Math.min(streak * 4, 20);

  // Overdue penalty
  const avgOverdue =
    recentSnapshots.reduce((sum, s) => sum + (s.overdue || 0), 0) /
    recentSnapshots.length;
  const overduePenalty = Math.min(avgOverdue * 5, 20);

  return Math.max(0, Math.round(avgCompletion * 0.8 + streakBonus - overduePenalty));
}

/**
 * Compute the current productivity streak in days
 * (consecutive days with completionPercentage >= 50%).
 */
export function computeStreak(snapshots) {
  if (!snapshots || snapshots.length === 0) return 0;
  const sorted = [...snapshots].sort((a, b) => b.date.localeCompare(a.date));
  let streak = 0;
  for (const snap of sorted) {
    if ((snap.completionPercentage || 0) >= 50) streak++;
    else break;
  }
  return streak;
}
