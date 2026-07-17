import { useMemo } from "react";

const PRIORITY_CONFIG = {
  High:   { dot: "bg-red-500",    badge: "bg-red-100 text-red-700",     icon: "🔥" },
  Medium: { dot: "bg-orange-400", badge: "bg-orange-100 text-orange-700", icon: "⚡" },
  Low:    { dot: "bg-emerald-500",badge: "bg-emerald-100 text-emerald-700", icon: "🌱" },
};

function isOverdue(task) {
  if (task.completed || !task.dueDate) return false;
  const now = new Date();
  if (task.time) {
    const dl = new Date(`${task.dueDate}T${task.time}:00`);
    return !isNaN(dl) && dl < now;
  }
  const d = new Date(task.dueDate);
  d.setHours(23, 59, 59, 999);
  return d < now;
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
          const doneCount = subtasks.filter((s) => s.done).length;
          const progress = subtasks.length ? Math.round((doneCount / subtasks.length) * 100) : 0;

          return (
            <li
              key={task.id}
              className={`flex items-start gap-3 p-3 rounded-xl border transition-all
                ${overdue
                  ? isDark ? "border-red-800/60 bg-red-900/15" : "border-red-100 bg-red-50/60"
                  : isDark ? "border-slate-700 bg-slate-800/50 hover:bg-slate-800" : "border-slate-100 bg-white hover:bg-slate-50"
                }`}
            >
              {/* Priority dot */}
              <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-semibold leading-tight ${textColor} ${overdue ? "text-red-600" : ""}`}>
                    {overdue && <span className="text-red-500 mr-1">⚠</span>}
                    {task.title}
                  </p>
                  <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${cfg.badge}`}>
                    {cfg.icon} {task.priority}
                  </span>
                </div>

                <div className={`flex items-center gap-2 mt-1 text-[10px] ${mutedText}`}>
                  {task.time && <span>🕐 {task.time}</span>}
                  {subtasks.length > 0 && <span>📎 {doneCount}/{subtasks.length}</span>}
                  {overdue && <span className="text-red-500 font-bold">Overdue</span>}
                </div>

                {subtasks.length > 0 && (
                  <div className={`mt-2 w-full h-1 rounded-full overflow-hidden ${isDark ? "bg-slate-700" : "bg-slate-100"}`}>
                    <div className="h-full rounded-full bg-gradient-to-r from-[#4F7CFF] to-[#7c3aed] transition-all"
                      style={{ width: `${progress}%` }} />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-1 shrink-0">
                <button
                  onClick={() => onComplete && onComplete(task.id)}
                  title="Mark Complete"
                  className="w-7 h-7 rounded-full bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 hover:text-white flex items-center justify-center text-xs transition cursor-pointer"
                >
                  ✓
                </button>
                <button
                  onClick={() => onEdit && onEdit(task)}
                  title="Edit Task"
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition cursor-pointer ${isDark ? "bg-slate-700 hover:bg-slate-600 text-slate-300" : "bg-slate-100 hover:bg-slate-200 text-slate-500"}`}
                >
                  ✏
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
