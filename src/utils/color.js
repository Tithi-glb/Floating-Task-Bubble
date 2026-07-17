/**
 * Compute a bubble colour based on task urgency.
 *
 * Accepts a date string (e.g., "Today", "Tomorrow", "2024-10-15") and an optional time string (unused, kept for backward compatibility).
 * Returns a hex colour following the red‑orange‑green urgency scheme.
 */
export function getTaskColor(dateStr, timeStr, completed = false) {
  const now = new Date();

  if (completed) {
    return "#475569"; // completed
  }

  const parsed = new Date(dateStr);

  if (!isNaN(parsed.getTime())) {
    const diffMs = parsed - now;
    const diffHours = diffMs / (1000 * 60 * 60);

    // overdue
    if (diffHours < 0) {
      return "#7f1d1d";
    }

    // within 24h
    if (diffHours <= 24) {
      return "#b91c1c";
    }

    // within 3 days
    if (diffHours <= 72) {
      return "#c2410c";
    }

    return "#166534";
  }

  return "#166534";
}

