/**
 * Compute a bubble colour based on task urgency.
 *
 * Accepts a date string (e.g., "Today", "Tomorrow", "2024-10-15") and an optional time string (unused, kept for backward compatibility).
 * Returns a hex colour following the red‑orange‑green urgency scheme.
 */
export function getTaskColor(dateStr, timeStr) {
  const now = new Date();
  const lower = (dateStr || "").trim().toLowerCase();

  // Keyword shortcuts – map urgency to colors
  if (lower === "today") return "#FF6B6B"; // urgent – red
  if (lower === "tomorrow") return "#FFB84C"; // soon – orange
  if (lower === "this week") return "#81C784"; // later – green

  // Attempt to parse the date string
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    const diffDays = Math.ceil((parsed - now) / (1000 * 60 * 60 * 24));
    if (diffDays <= 1) return "#FF6B6B"; // urgent
    if (diffDays <= 3) return "#FFB84C"; // medium urgency
    return "#81C784"; // low urgency / future
  }

  // Fallback colour (green)
  return "#81C784";
}

