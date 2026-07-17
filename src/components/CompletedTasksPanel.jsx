import { useMemo } from "react";

const PRIORITY_BADGE = {
  High:   "bg-red-100 text-red-700",
  Medium: "bg-orange-100 text-orange-700",
  Low:    "bg-emerald-100 text-emerald-700",
};

/**
 * CompletedTasksPanel — shows all tasks completed today.
 * Props: tasks, theme
 */
export default function CompletedTasksPanel({ tasks, theme }) {
  const isDark = theme === "dark";
  const textColor = isDark ? "text-slate-100" : "text-slate-800";
  const mutedText = isDark ? "text-slate-400" : "text-slate-500";

  const today = new Date().toISOString().split("T")[0];

  const completedTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (!t.completed) return false;
      // Task was completed today: check completedDate field first, fall back to dueDate
      return t.completedDate === today || t.dueDate === today;
    });
  }, [tasks, today]);

  if (completedTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-3">
        <span className="text-4xl">🫧</span>
        <p className={`text-base font-bold ${textColor}`}>Nothing completed yet today</p>
        <p className={`text-sm ${mutedText}`}>Your completed tasks will appear here.</p>
      </div>
    );
  }

  // Compute total subtasks done
  const totalSubtasksDone = completedTasks.reduce((sum, t) => {
    return sum + (t.subtasks || []).filter((s) => s.done).length;
  }, 0);

  return (
    <div className="flex flex-col gap-3">
      {/* Summary */}
      <div className="flex items-center gap-3 pb-2">
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${isDark ? "bg-emerald-900/30 text-emerald-400" : "bg-emerald-50 text-emerald-700"}`}>
          ✅ {completedTasks.length} completed today
        </div>
        {totalSubtasksDone > 0 && (
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${isDark ? "bg-indigo-900/30 text-indigo-400" : "bg-indigo-50 text-indigo-700"}`}>
            📎 {totalSubtasksDone} subtasks done
          </div>
        )}
      </div>

      {/* Congratulations banner if there are many completions */}
      {completedTasks.length >= 3 && (
        <div className={`flex items-center gap-2 p-3 rounded-xl text-sm font-semibold border ${isDark ? "bg-emerald-900/20 border-emerald-700/40 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-700"}`}>
          <span className="text-xl">🎉</span>
          Great work! You've completed {completedTasks.length} tasks today.
        </div>
      )}

      {/* Task list */}
      <ul className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
        {completedTasks.map((task) => {
          const subtasks = task.subtasks || [];
          const doneSubtasks = subtasks.filter((s) => s.done).length;

          return (
            <li
              key={task.id}
              className={`flex items-start gap-3 p-3 rounded-xl border ${isDark ? "border-slate-700 bg-slate-800/40" : "border-slate-100 bg-white"}`}
            >
              {/* Check circle */}
              <div className="mt-0.5 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 shadow-sm">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>

              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold line-through opacity-70 ${textColor}`}>{task.title}</p>
                <div className={`flex items-center gap-2 mt-0.5 text-[10px] ${mutedText}`}>
                  {task.time && <span>🕐 {task.time}</span>}
                  {subtasks.length > 0 && (
                    <span>📎 {doneSubtasks}/{subtasks.length} steps</span>
                  )}
                </div>
              </div>

              <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${PRIORITY_BADGE[task.priority] || PRIORITY_BADGE.Medium}`}>
                {task.priority}
              </span>
            </li>
          );
        })}
      </ul>

      {/* Productivity note */}
      <p className={`text-center text-[10px] pt-1 ${mutedText}`}>
        Keep it up! Every completed task counts. 🌟
      </p>
    </div>
  );
}
