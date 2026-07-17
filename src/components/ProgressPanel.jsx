import { useMemo } from "react";

/**
 * ProgressPanel — compact progress summary for the dock.
 * Shows today's stats + a mini breakdown. Full tracker is in ProgressTracker.jsx
 */
export default function ProgressPanel({ tasks, theme }) {
  const isDark = theme === "dark";
  const textColor = isDark ? "text-slate-100" : "text-slate-800";
  const mutedText = isDark ? "text-slate-400" : "text-slate-500";
  const today = new Date().toISOString().split("T")[0];

  const todayTasks = useMemo(() => tasks.filter((t) => t.dueDate === today || (t.completed && t.completedDate === today)), [tasks, today]);
  const completed = useMemo(() => todayTasks.filter((t) => t.completed), [todayTasks]);
  const pending = useMemo(() => todayTasks.filter((t) => !t.completed), [todayTasks]);
  const percentage = todayTasks.length ? Math.round((completed.length / todayTasks.length) * 100) : 0;

  // Last 7 days mini bar data
  const weekData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const ds = d.toISOString().split("T")[0];
      const dt = tasks.filter((t) => t.dueDate === ds);
      const c = dt.filter((t) => t.completed).length;
      const pct = dt.length ? Math.round((c / dt.length) * 100) : 0;
      return { label: d.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 1), pct, count: c, isToday: ds === today };
    });
  }, [tasks, today]);

  const ringCirc = 2 * Math.PI * 26;
  const ringColor = percentage >= 75 ? "#10b981" : percentage >= 40 ? "#4F7CFF" : "#f59e0b";

  return (
    <div className="flex flex-col gap-5">
      {/* Today summary */}
      <div className="flex items-center gap-6">
        {/* Ring chart */}
        <div className="relative flex items-center justify-center w-20 h-20 shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 60 60">
            <circle cx="30" cy="30" r="26" stroke={isDark ? "#1e293b" : "#e2e8f0"} strokeWidth="6" fill="none" />
            <circle cx="30" cy="30" r="26" stroke={ringColor} strokeWidth="6" fill="none"
              strokeDasharray={ringCirc} strokeDashoffset={ringCirc * (1 - percentage / 100)}
              strokeLinecap="round" className="transition-all duration-1000" />
          </svg>
          <div className="absolute text-center">
            <p className={`text-lg font-black leading-none ${textColor}`}>{percentage}%</p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex-1 space-y-2">
          {[
            { label: "Total",     value: todayTasks.length, color: textColor },
            { label: "Completed", value: completed.length,  color: "text-emerald-500" },
            { label: "Pending",   value: pending.length,    color: "text-amber-500" },
          ].map((s) => (
            <div key={s.label} className="flex items-center justify-between">
              <span className={`text-xs ${mutedText}`}>{s.label}</span>
              <span className={`text-sm font-extrabold ${s.color}`}>{s.value}</span>
            </div>
          ))}
          {todayTasks.length > 0 && (
            <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? "bg-slate-700" : "bg-slate-100"}`}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${percentage}%`, background: `linear-gradient(90deg, #4F7CFF, #7c3aed)` }} />
            </div>
          )}
        </div>
      </div>

      {todayTasks.length === 0 && (
        <p className={`text-sm text-center py-2 ${mutedText}`}>No tasks due today. 🫧</p>
      )}

      {/* 7-day mini chart */}
      <div>
        <p className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${mutedText}`}>Last 7 Days</p>
        <div className="flex items-end gap-1.5 h-16">
          {weekData.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex-1 flex items-end rounded-t-lg overflow-hidden"
                style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)" }}>
                <div
                  className="w-full rounded-t-lg transition-all duration-700"
                  style={{
                    height: `${Math.max(d.pct, 4)}%`,
                    background: d.isToday
                      ? "linear-gradient(to top, #4F7CFF, #7c3aed)"
                      : d.pct >= 75 ? "#10b981" : d.pct >= 40 ? "#4F7CFF88" : "#94a3b888",
                  }}
                />
              </div>
              <span className={`text-[8px] font-bold ${d.isToday ? "text-[#4F7CFF]" : mutedText}`}>{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Completed list */}
      {completed.length > 0 && (
        <div>
          <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${mutedText}`}>✅ Completed Today</p>
          <ul className="space-y-1.5 max-h-32 overflow-y-auto">
            {completed.map((t) => (
              <li key={t.id} className={`flex items-center gap-2 p-2 rounded-lg text-xs ${isDark ? "bg-slate-800" : "bg-slate-50"}`}>
                <span className="text-emerald-500 font-bold">✔</span>
                <span className={`flex-1 truncate line-through opacity-70 ${textColor}`}>{t.title}</span>
                <span className={`shrink-0 text-[9px] px-1.5 py-0.5 rounded-full ${t.priority === "High" ? "bg-red-100 text-red-600" : t.priority === "Low" ? "bg-emerald-100 text-emerald-600" : "bg-orange-100 text-orange-600"}`}>
                  {t.priority}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
