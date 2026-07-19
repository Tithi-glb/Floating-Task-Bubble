const TASK_STORAGE_PREFIX = "floating-task-bubbles";

const getToday = () => new Date().toISOString().split("T")[0];

function getUserTaskStorageKey(currentUser = null) {
  const userId = currentUser?.id || currentUser?.email || "guest";
  // Generate a storage key per signed-in user so tasks remain isolated by account.
  return `${TASK_STORAGE_PREFIX}-${userId}`;
}

export function normalizeTask(task = {}, defaults = {}) {
  const safeTask = task || {};
  const dateValue = safeTask.date || safeTask.dueDate || getToday();
  const createdAt = safeTask.createdAt || new Date().toISOString();

  return {
    ...safeTask,
    id: safeTask.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title: safeTask.title || "",
    description: safeTask.description || "",
    date: dateValue,
    time: safeTask.time || "",
    priority: safeTask.priority || defaults.priority || "",
    completed: Boolean(safeTask.completed),
    subtasks: Array.isArray(safeTask.subtasks) ? safeTask.subtasks : [],
    createdAt,
    updatedAt: safeTask.updatedAt || createdAt,
    dueDate: safeTask.dueDate || dateValue,
    isFocused: Boolean(safeTask.isFocused),
    color: safeTask.color || "#60A5FA",
    reminderDate: safeTask.reminderDate || "",
    reminderTime: safeTask.reminderTime || "",
    hasReminder: safeTask.hasReminder !== undefined ? safeTask.hasReminder : !!(safeTask.reminderDate && safeTask.reminderTime),
  };
}

export function loadTasks(currentUser = null) {
  try {
    const storageKey = getUserTaskStorageKey(currentUser);
    // Load tasks from the current user's storage key, which starts empty for new accounts.
    const savedTasks = JSON.parse(localStorage.getItem(storageKey) || "[]");
    return Array.isArray(savedTasks) ? savedTasks.map((task) => normalizeTask(task)) : [];
  } catch {
    return [];
  }
}

export function saveTasks(tasks, currentUser = null) {
  try {
    const normalizedTasks = Array.isArray(tasks)
      ? tasks.map((task) => normalizeTask(task))
      : [];

    const storageKey = getUserTaskStorageKey(currentUser);
    // Save to the same per-user storage key so updates stay scoped to that account.
    localStorage.setItem(storageKey, JSON.stringify(normalizedTasks));
  } catch {
    // Ignore storage errors to keep the app resilient.
  }
}

export function getStorageKey(currentUser = null) {
  return getUserTaskStorageKey(currentUser);
}
