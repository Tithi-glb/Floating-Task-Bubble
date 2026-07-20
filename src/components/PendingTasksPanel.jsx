import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const PRIORITY_CONFIG = {
  High: { dot: "bg-red-500", badge: "bg-red-100 text-red-700", icon: "🔥" },
  Medium: { dot: "bg-orange-400", badge: "bg-orange-100 text-orange-700", icon: "⚡" },
  Low: { dot: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-700", icon: "🌱" },
};

function parseLocalDateTime(dateStr, timeStr) {
  if (!dateStr) return new Date(NaN);
  const separator = dateStr.includes("/") ? "/" : "-";
  const parts = dateStr.split(separator).map(Number);
  if (parts.some(isNaN) || parts.length < 3) return new Date(NaN);

  let year, month, day;
  if (parts[0] > 1000) {
    [year, month, day] = parts;
  } else if (parts[2] > 1000) {
    year = parts[2];
    if (parts[0] > 12) {
      month = parts[1];
      day = parts[0];
    } else if (parts[1] > 12) {
      month = parts[0];
      day = parts[1];
    } else {
      month = parts[1];
      day = parts[0];
    }
  } else {
    [year, month, day] = parts;
  }

  const [hour, minute] = (timeStr || "00:00").split(":").map(Number);
  if (isNaN(hour) || isNaN(minute)) return new Date(NaN);
  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

function isOverdue(task) {
  if (task.completed || !task.dueDate) return false;
  const now = new Date();
  if (task.time) {
    const dl = parseLocalDateTime(task.dueDate, task.time);
    return !isNaN(dl.getTime()) && dl < now;
  }
  const d = parseLocalDateTime(task.dueDate, "23:59");
  return !isNaN(d.getTime()) && d < now;
}

/**
 * PendingTasksPanel — shows all pending (incomplete) tasks due today.
 * Props: tasks, theme, onComplete, onEdit
 */
export default function PendingTasksPanel({ tasks, theme, onComplete, onEdit }) {
  const isDark = theme === "dark";
  const textColor = isDark ? "text-slate-100" : "text-slate-800";
  const mutedText = isDark ? "text-slate-400" : "text-slate-500";

  const today = new Date().toISOString().split("T")[0];
  const [expandedTaskId, setExpandedTaskId] = useState(null);

  const pendingTasks = useMemo(() => {
    return tasks
      .filter((t) => !t.completed && t.dueDate === today)
      .sort((a, b) => {
        // Sort by priority first
        const pOrder = { High: 0, Medium: 1, Low: 2 };
        const pDiff = (pOrder[a.priority] ?? 1) - (pOrder[b.priority] ?? 1);
        if (pDiff !== 0) return pDiff;
        // Then by time
        if (a.time && b.time) return a.time.localeCompare(b.time);
        return 0;
      });
  }, [tasks, today]);

  const overdueCount = useMemo(() => pendingTasks.filter(isOverdue).length, [pendingTasks]);

  if (pendingTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-3">
        <span className="text-4xl">🎉</span>
        <p className={`text-base font-bold ${textColor}`}>All clear for today!</p>
        <p className={`text-sm ${mutedText}`}>No pending tasks due today.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Summary bar */}
      <div className="flex items-center gap-3 pb-2">
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${isDark ? "bg-amber-900/30 text-amber-400" : "bg-amber-50 text-amber-700"}`}>
          <span>📝</span> {pendingTasks.length} pending
        </div>
        {overdueCount > 0 && (
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${isDark ? "bg-red-900/30 text-red-400" : "bg-red-50 text-red-700"}`}>
            <span>⚠️</span> {overdueCount} overdue
          </div>
        )}
      </div>

      {/* Task list */}
      <ul className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
        {pendingTasks.map((task) => {
          const cfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.Medium;
          const overdue = isOverdue(task);
          const subtasks = task.subtasks || [];
          const doneCount = subtasks.filter((s) => s.done || s.completed).length;
          const progress = subtasks.length ? Math.round((doneCount / subtasks.length) * 100) : 0;
          const isExpanded = expandedTaskId === task.id;

          return (
            <li
              key={task.id}
              className={`flex flex-col gap-1 p-3 rounded-xl border cursor-pointer select-none transition-all duration-200
                ${overdue
                  ? isDark ? "border-red-800/60 bg-red-900/15 hover:bg-red-900/25" : "border-red-100 bg-red-50/60 hover:bg-red-100/40"
                  : isDark ? "border-slate-700 bg-slate-800/50 hover:bg-slate-800" : "border-slate-100 bg-white hover:bg-slate-50"
                }`}
              onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
            >
              {/* Header Row */}
              <div className="flex items-start gap-3 w-full">
                {/* Priority dot */}
                <div className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${cfg.dot}`} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-semibold leading-tight ${textColor} ${overdue ? "text-red-600 dark:text-red-400" : ""}`}>
                      {overdue && <span className="text-red-500 mr-1">⚠</span>}
                      {task.title}
                    </p>
                  </div>

                  <div className={`flex items-center gap-2 mt-1 text-[10px] ${mutedText}`}>
                    {task.time && <span>🕐 {task.time}</span>}
                    {subtasks.length > 0 && <span>📎 {doneCount}/{subtasks.length} steps</span>}
                    {overdue && <span className="text-red-500 font-bold">Overdue</span>}
                  </div>

                  {subtasks.length > 0 && (
                    <div className={`mt-2 w-full h-1 rounded-full overflow-hidden ${isDark ? "bg-slate-700" : "bg-slate-100"}`}>
                      <div className="h-full rounded-full bg-gradient-to-r from-[#4F7CFF] to-[#7c3aed] transition-all"
                        style={{ width: `${progress}%` }} />
                    </div>
                  )}
                </div>

                {/* Right side options and chevron */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${cfg.badge}`}>
                    {cfg.icon} {task.priority}
                  </span>
                  
                  {/* Chevron Icon */}
                  <svg
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${mutedText} ${isExpanded ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>

                  {/* Actions */}
                  <div className="flex flex-col gap-1 ml-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); onComplete && onComplete(task.id); }}
                      title="Mark Complete"
                      className="w-7 h-7 rounded-full bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 hover:text-white flex items-center justify-center text-xs transition cursor-pointer"
                    >
                      ✓
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onEdit && onEdit(task); }}
                      title="Edit Task"
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition cursor-pointer ${isDark ? "bg-slate-700 hover:bg-slate-600 text-slate-300" : "bg-slate-100 hover:bg-slate-200 text-slate-500"}`}
                    >
                      ✏
                    </button>
                  </div>
                </div>
              </div>

              {/* Expandable Details */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="overflow-hidden w-full"
                    onClick={(e) => e.stopPropagation()} // Prevent collapse when clicking details
                  >
                    <div className={`mt-3 pt-3 border-t text-xs flex flex-col gap-2.5 ${isDark ? "border-slate-700/60" : "border-slate-100"}`}>
                      {/* Description */}
                      <div>
                        <span className={`font-bold block mb-0.5 uppercase tracking-wider text-[9px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                          Description
                        </span>
                        <p className={task.description ? textColor : mutedText}>
                          {task.description || "No description provided."}
                        </p>
                      </div>

                      {/* Subtasks */}
                      {subtasks.length > 0 && (
                        <div>
                          <span className={`font-bold block mb-1 uppercase tracking-wider text-[9px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                            Checklist Steps
                          </span>
                          <ul className="space-y-1 pl-0.5">
                            {subtasks.map((sub, index) => {
                              const isSubDone = sub.done || sub.completed;
                              return (
                                <li key={index} className="flex items-center gap-2">
                                  {isSubDone ? (
                                    <div className="w-3.5 h-3.5 rounded bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="4">
                                        <polyline points="20 6 9 17 4 12" />
                                      </svg>
                                    </div>
                                  ) : (
                                    <div className={`w-3.5 h-3.5 rounded border shrink-0 ${isDark ? "border-slate-600 bg-slate-800" : "border-slate-300 bg-slate-50"}`} />
                                  )}
                                  <span className={isSubDone ? `line-through opacity-75 ${textColor}` : textColor}>
                                    {sub.text}
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}

                      {/* Reminder and Deadline Info */}
                      <div className={`mt-1 pt-1.5 text-[9px] flex flex-col gap-1.5 ${mutedText}`}>
                        {task.dueDate && (
                          <div className="flex items-center gap-1.5">
                            <span>📅 Due date: {task.dueDate}</span>
                            {task.time && (
                              <>
                                <span>•</span>
                                <span>🕐 Due time: {task.time}</span>
                              </>
                            )}
                          </div>
                        )}
                        {task.reminderDate && (
                          <div className="flex items-center gap-1.5">
                            <span>🔔 Reminder: {task.reminderDate}</span>
                            {task.reminderTime && (
                              <>
                                <span>•</span>
                                <span>🕐 Time: {task.reminderTime}</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
