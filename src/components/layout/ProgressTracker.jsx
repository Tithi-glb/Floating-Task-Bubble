import { useState, useMemo, useRef, useEffect } from "react";
import {
  loadProgressHistory,
  computeProductivityScore,
  computeStreak,
  getLastNDaysSnapshots,
} from "../../utils/progressStorage";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getTodayString = () => new Date().toISOString().split("T")[0];

const getYesterdayString = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
};

function getProgressByDate(tasks, dateString) {
  const dateTasks = tasks.filter((t) => t.dueDate === dateString);
  const total = dateTasks.length;
  const completed = dateTasks.filter((t) => t.completed).length;
  const pending = total - completed;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
  const now = new Date();
  const overdue = dateTasks.filter((t) => {
    if (t.completed || !t.time) return false;
    const dl = new Date(`${t.dueDate}T${t.time}:00`);
    return !isNaN(dl) && dl < now;
  }).length;
  return { total, completed, pending, percentage, overdue };
}

function getTasksForRange(tasks, rangeDays) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const cutoff = new Date(today); cutoff.setDate(cutoff.getDate() - rangeDays + 1);
  return tasks.filter((t) => {
    if (!t.dueDate) return false;
    const td = new Date(t.dueDate); td.setHours(0, 0, 0, 0);
    return td >= cutoff && td <= today;
  });
}

function getCompletedTasksByDate(tasks, dateString) {
  return tasks.filter((t) => t.dueDate === dateString && t.completed);
}

function getCompletionStats(filteredTasks) {
  const total = filteredTasks.length;
  const completed = filteredTasks.filter((t) => t.completed).length;
  const pending = total - completed;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { total, completed, pending, percentage };
}

function getLongestStreak(filteredTasks) {
  const completedByDate = {};
  filteredTasks.forEach((t) => { if (t.completed && t.dueDate) completedByDate[t.dueDate] = true; });
  const sorted = Object.keys(completedByDate).sort();
  if (!sorted.length) return 0;
  let longest = 1, current = 1;
  for (let i = 1; i < sorted.length; i++) {
    const diff = Math.ceil(Math.abs(new Date(sorted[i]) - new Date(sorted[i - 1])) / 86400000);
    if (diff === 1) { current++; if (current > longest) longest = current; }
    else current = 1;
  }
  return longest;
}

function getMostProductiveDay(filteredTasks) {
  const byDate = {};
  filteredTasks.forEach((t) => {
    if (t.completed && t.dueDate) byDate[t.dueDate] = (byDate[t.dueDate] || 0) + 1;
  });
  let max = 0, bestDay = null;
  Object.entries(byDate).forEach(([date, count]) => { if (count > max) { max = count; bestDay = date; } });
  if (!bestDay) return { date: null, count: 0 };
  const dObj = new Date(bestDay);
  const dStr = new Date(dObj.getTime() + dObj.getTimezoneOffset() * 60000).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  return { date: dStr, count: max };
}

function calculateTaskProgress(task) {
  if (!task.subtasks || task.subtasks.length === 0) return task.completed ? 100 : 0;
  return Math.round((task.subtasks.filter((s) => s.done).length / task.subtasks.length) * 100);
}

function getTodaysTasks(tasks) {
  const today = getTodayString();
  return tasks.filter((t) => t.completed ? t.completedDate === today : t.dueDate === today);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const PieRing = ({ percentage, theme }) => {
  const r = 38, circ = 2 * Math.PI * r;
  const offset = circ - (percentage / 100) * circ;
  const color = percentage >= 75 ? "#10b981" : percentage >= 40 ? "#4F7CFF" : "#f59e0b";
  return (
    <div className="relative flex items-center justify-center w-24 h-24 shrink-0">
      <svg className="w-full h-full -rotate-90">
        <circle cx="48" cy="48" r={r} stroke={theme === "dark" ? "#1e293b" : "#e2e8f0"} strokeWidth="9" fill="none" />
        <circle cx="48" cy="48" r={r} stroke={color} strokeWidth="9" fill="none"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-xl font-black ${theme === "dark" ? "text-white" : "text-slate-800"}`}>{percentage}%</span>
      </div>
    </div>
  );
};

const PRIORITY_BADGE = {
  High: "bg-red-100 text-red-700 border-red-200",
  Medium: "bg-orange-100 text-orange-700 border-orange-200",
  Low: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

function TaskCard({ task, theme, expandedTaskId, setExpandedTaskId }) {
  const progress = calculateTaskProgress(task);
  const subtaskCount = task.subtasks?.length || 0;
  const isExpanded = expandedTaskId === task.id;
  const textColor = theme === "dark" ? "text-slate-100" : "text-slate-800";
  const mutedText = theme === "dark" ? "text-slate-400" : "text-slate-500";

  const formattedDue = (() => {
    if (!task.dueDate) return "—";
    const [y, m, d] = task.dueDate.split("-");
    const label = new Date(+y, +m - 1, +d).toLocaleDateString("en-US", { day: "numeric", month: "short" });
    return task.time ? `${label}, ${task.time}` : label;
  })();

  return (
    <div className={`rounded-xl border p-3 flex flex-col gap-2 transition-all ${theme === "dark" ? "bg-slate-800/60 border-slate-700" : "bg-white border-slate-100"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-sm">{task.completed ? "✅" : task.isFocused ? "⭐" : "📌"}</span>
          <span className={`text-sm font-semibold truncate ${textColor} ${task.completed ? "line-through opacity-60" : ""}`}>{task.title}</span>
        </div>
        <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${PRIORITY_BADGE[task.priority] || PRIORITY_BADGE.Medium}`}>
          {task.priority || "Medium"}
        </span>
      </div>
      <div className={`flex flex-wrap items-center gap-3 text-[11px] ${mutedText}`}>
        <span>🕐 {formattedDue}</span>
        <span>⚡ {progress}%</span>
        {subtaskCount > 0 && <span>📎 {subtaskCount} subtask{subtaskCount !== 1 ? "s" : ""}</span>}
      </div>
      <div className={`w-full h-1.5 rounded-full overflow-hidden ${theme === "dark" ? "bg-slate-700" : "bg-slate-100"}`}>
        <div className={`h-full rounded-full transition-all duration-700 ${task.completed ? "bg-emerald-500" : "bg-gradient-to-r from-[#4F7CFF] to-[#7c3aed]"}`}
          style={{ width: `${progress}%` }} />
      </div>
      {subtaskCount > 0 && (
        <button onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
          className={`self-start text-[11px] font-semibold flex items-center gap-1 cursor-pointer ${theme === "dark" ? "text-slate-400 hover:text-slate-200" : "text-slate-400 hover:text-slate-700"}`}>
          <span className="text-[9px]">{isExpanded ? "▲" : "▼"}</span>
          {isExpanded ? "Hide" : "Subtasks"}
        </button>
      )}
      {isExpanded && (
        <ul className="flex flex-col gap-1.5 pl-2 pt-1 border-t border-dashed border-slate-200 mt-1">
          {task.subtasks.map((s) => (
            <li key={s.id} className={`flex items-center gap-2 text-xs ${s.done ? "text-emerald-500" : mutedText}`}>
              <span>{s.done ? "✔" : "○"}</span>
              <span className={s.done ? "line-through opacity-70" : ""}>{s.text}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, color = "text-slate-800", theme }) {
  const cardBg = theme === "dark" ? "bg-slate-800/60 border-slate-700" : "bg-white/80 border-slate-200";
  const textColor = theme === "dark" ? "text-slate-100" : "text-slate-800";
  const mutedText = theme === "dark" ? "text-slate-400" : "text-slate-500";
  return (
    <div className={`p-4 rounded-2xl border backdrop-blur-xl shadow-sm flex flex-col gap-1 ${cardBg}`}>
      <div className="flex items-center gap-2">
        <span className="text-xl">{icon}</span>
        <p className={`text-[10px] font-bold uppercase tracking-wider ${mutedText}`}>{label}</p>
      </div>
      <p className={`text-xl font-extrabold mt-1 pl-7 ${color || textColor}`}>{value}</p>
      {sub && <p className={`text-[10px] pl-7 ${mutedText}`}>{sub}</p>}
    </div>
  );
}

// ─── Main ProgressTracker ─────────────────────────────────────────────────────

export default function ProgressTracker({ tasks, theme, onClose }) {
  const todayStr = getTodayString();
  const yesterdayStr = getYesterdayString();

  const todayProgress = getProgressByDate(tasks, todayStr);
  const yesterdayProgress = getProgressByDate(tasks, yesterdayStr);

  const [selectedDate, setSelectedDate] = useState(todayStr);
  const selectedProgress = getProgressByDate(tasks, selectedDate);
  const selectedCompletedTasks = getCompletedTasksByDate(tasks, selectedDate);

  const [selectedRange, setSelectedRange] = useState("7 Days");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const [showTodayDetails, setShowTodayDetails] = useState(false);
  const [activeTab, setActiveTab] = useState("completed");
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!showTodayDetails) return;
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowTodayDetails(false);
        setExpandedTaskId(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showTodayDetails]);

  const todayTasks = useMemo(() => getTodaysTasks(tasks), [tasks]);
  const todayCompleted = useMemo(() => todayTasks.filter((t) => t.completed), [todayTasks]);
  const todayPending = useMemo(() => todayTasks.filter((t) => !t.completed && calculateTaskProgress(t) === 0), [todayTasks]);
  const todayInProgress = useMemo(() => todayTasks.filter((t) => !t.completed && calculateTaskProgress(t) > 0), [todayTasks]);

  // Weekly / monthly
  const weekTasks = useMemo(() => getTasksForRange(tasks, 7), [tasks]);
  const monthTasks = useMemo(() => getTasksForRange(tasks, 30), [tasks]);
  const weekStats = useMemo(() => getCompletionStats(weekTasks), [weekTasks]);
  const monthStats = useMemo(() => getCompletionStats(monthTasks), [monthTasks]);

  // History
  const filteredHistoryTasks = useMemo(() => {
    if (selectedRange === "Custom") {
      if (!customStart || !customEnd) return [];
      const s = new Date(customStart); s.setHours(0, 0, 0, 0);
      const e = new Date(customEnd); e.setHours(0, 0, 0, 0);
      return tasks.filter((t) => { if (!t.dueDate) return false; const td = new Date(t.dueDate); td.setHours(0, 0, 0, 0); return td >= s && td <= e; });
    }
    const days = parseInt(selectedRange.split(" ")[0]);
    return getTasksForRange(tasks, days);
  }, [tasks, selectedRange, customStart, customEnd]);

  const historyStats = useMemo(() => getCompletionStats(filteredHistoryTasks), [filteredHistoryTasks]);
  const longestStreak = useMemo(() => getLongestStreak(filteredHistoryTasks), [filteredHistoryTasks]);
  const mostProductive = useMemo(() => getMostProductiveDay(filteredHistoryTasks), [filteredHistoryTasks]);

  // From persistent history storage
  const progressHistory = useMemo(() => loadProgressHistory(), [tasks]);
  const historySnapshots = useMemo(() => Object.values(progressHistory), [progressHistory]);
  const productivityScore = useMemo(() => computeProductivityScore(historySnapshots), [historySnapshots]);
  const currentStreak = useMemo(() => computeStreak(historySnapshots), [historySnapshots]);

  // All-time
  const allCompleted = useMemo(() => tasks.filter((t) => t.completed).length, [tasks]);
  const allPending = useMemo(() => tasks.filter((t) => !t.completed).length, [tasks]);
  const allOverdue = useMemo(() => {
    const now = new Date();
    return tasks.filter((t) => {
      if (t.completed || !t.dueDate || !t.time) return false;
      const dl = new Date(`${t.dueDate}T${t.time}:00`);
      return !isNaN(dl) && dl < now;
    }).length;
  }, [tasks]);

  const historyByDate = useMemo(() => {
    const grouped = {};
    filteredHistoryTasks.forEach((t) => {
      if (!t.dueDate) return;
      if (!grouped[t.dueDate]) grouped[t.dueDate] = { total: 0, completed: 0, tasks: [] };
      grouped[t.dueDate].total++;
      if (t.completed) { grouped[t.dueDate].completed++; grouped[t.dueDate].tasks.push(t); }
    });
    return Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a)).map((date) => ({
      date, ...grouped[date],
      percentage: Math.round((grouped[date].completed / grouped[date].total) * 100),
    }));
  }, [filteredHistoryTasks]);

  const cardBg = theme === "dark" ? "bg-slate-900/80 border-slate-700" : "bg-white/80 border-slate-200";
  const textColor = theme === "dark" ? "text-slate-100" : "text-slate-800";
  const mutedText = theme === "dark" ? "text-slate-400" : "text-slate-500";
  const allDoneToday = todayProgress.total > 0 && todayProgress.percentage === 100;

  const TABS = [
    { key: "completed", label: "🟢 Completed", count: todayCompleted.length },
    { key: "pending", label: "🟡 Pending", count: todayPending.length },
    { key: "inprogress", label: "🔵 In Progress", count: todayInProgress.length },
  ];
  const tabTaskMap = { completed: todayCompleted, pending: todayPending, inprogress: todayInProgress };

  // Score color
  const scoreColor = productivityScore >= 70 ? "text-emerald-500" : productivityScore >= 40 ? "text-amber-500" : "text-red-500";

  return (
    <div className={`flex-1 h-full overflow-y-auto p-6 md:p-8 ${theme === "dark" ? "text-slate-100" : "text-slate-800"}`}
      style={{ scrollbarWidth: "thin" }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-extrabold flex items-center gap-2">
          <span>📈</span> Progress Tracker
        </h2>
        <button onClick={onClose}
          className="w-10 h-10 rounded-full bg-red-500/10 hover:bg-red-500 hover:text-white text-slate-600 transition-all duration-200 flex items-center justify-center font-bold text-lg cursor-pointer">
          ✕
        </button>
      </div>

      {/* ── Top KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard icon="🎯" label="Productivity Score" value={`${productivityScore}/100`} color={scoreColor} theme={theme} />
        <StatCard icon="🔥" label="Current Streak" value={`${currentStreak} day${currentStreak !== 1 ? "s" : ""}`} color="text-amber-500" theme={theme} />
        <StatCard icon="✅" label="Total Completed" value={allCompleted} color="text-emerald-500" theme={theme} />
        <StatCard icon="⏳" label="Total Pending" value={allPending} color="text-blue-500" theme={theme} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard icon="⚠️" label="Overdue" value={allOverdue} color="text-red-500" theme={theme} />
        <StatCard icon="📊" label="Avg Completion" value={`${historyStats.percentage}%`} theme={theme} />
        <StatCard icon="🏆" label="Longest Streak" value={`${longestStreak} day${longestStreak !== 1 ? "s" : ""}`} theme={theme} />
        <StatCard icon="🌟" label="Best Day" value={mostProductive.date || "—"} sub={mostProductive.count ? `${mostProductive.count} tasks` : undefined} theme={theme} />
      </div>

      {/* ── Today / Yesterday / Week / Month Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Today", p: todayProgress, color: todayProgress.percentage >= 75 ? "text-emerald-500" : "text-blue-500" },
          { label: "Yesterday", p: yesterdayProgress, color: "text-slate-500" },
          { label: "This Week", p: weekStats, color: "text-indigo-500" },
          { label: "This Month", p: monthStats, color: "text-purple-500" },
        ].map(({ label, p, color }) => (
          <div key={label} className={`p-4 rounded-2xl border backdrop-blur-xl shadow-sm flex flex-col gap-2 ${cardBg}`}>
            <p className={`text-[10px] font-bold uppercase tracking-wider ${mutedText}`}>{label}</p>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-2xl font-black ${color}`}>{p.percentage}%</p>
                <p className={`text-[10px] ${mutedText}`}>{p.completed}/{p.total} done</p>
              </div>
              <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="14" stroke={theme === "dark" ? "#1e293b" : "#e2e8f0"} strokeWidth="4" fill="none" />
                <circle cx="18" cy="18" r="14" stroke="#4F7CFF" strokeWidth="4" fill="none"
                  strokeDasharray={2 * Math.PI * 14}
                  strokeDashoffset={2 * Math.PI * 14 * (1 - p.percentage / 100)}
                  strokeLinecap="round" className="transition-all duration-700" />
              </svg>
            </div>
            <div className={`w-full h-1.5 rounded-full overflow-hidden ${theme === "dark" ? "bg-slate-700" : "bg-slate-100"}`}>
              <div className="h-full rounded-full bg-gradient-to-r from-[#4F7CFF] to-[#7c3aed] transition-all duration-700"
                style={{ width: `${p.percentage}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Today's Details ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className={`p-6 rounded-3xl border backdrop-blur-xl shadow-xl flex flex-col gap-4 relative ${cardBg}`}>
          <h3 className="text-xl font-bold flex items-center gap-2">📊 Today's Progress</h3>
          {allDoneToday && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 p-3 rounded-xl flex items-center gap-2 text-sm font-bold">
              🎉 All done! You completed every task today.
            </div>
          )}
          {todayProgress.total === 0 ? (
            <div className={`text-center py-8 text-sm ${mutedText}`}>🫧 No tasks due today.</div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-6">
                <div className="flex-1 space-y-3">
                  {[
                    { label: "Total", value: todayProgress.total, color: textColor },
                    { label: "Completed", value: todayProgress.completed, color: "text-emerald-500" },
                    { label: "Pending", value: todayProgress.pending, color: "text-amber-500" },
                    { label: "Overdue", value: todayProgress.overdue, color: "text-red-500" },
                  ].map((r) => (
                    <div key={r.label} className="flex justify-between items-center">
                      <span className={mutedText}>{r.label}:</span>
                      <span className={`font-bold text-lg ${r.color}`}>{r.value}</span>
                    </div>
                  ))}
                  <div className={`w-full h-2 rounded-full overflow-hidden ${theme === "dark" ? "bg-slate-700" : "bg-slate-200"}`}>
                    <div className="bg-gradient-to-r from-[#4F7CFF] to-[#7c3aed] h-full rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${todayProgress.percentage}%` }} />
                  </div>
                </div>
                <PieRing percentage={todayProgress.percentage} theme={theme} />
              </div>
              <div className="relative" ref={dropdownRef}>
                <button onClick={() => { setShowTodayDetails((v) => !v); setExpandedTaskId(null); }}
                  className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${showTodayDetails ? "bg-[#4F7CFF] text-white border-[#4F7CFF] shadow-md" : theme === "dark" ? "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"}`}>
                  <span>📋</span>
                  {showTodayDetails ? "Hide Task Details" : "View Today's Task Status"}
                  <span className="ml-1 text-xs">{showTodayDetails ? "▲" : "▼"}</span>
                </button>
                {showTodayDetails && (
                  <div className={`absolute left-0 top-full mt-2 w-full z-50 rounded-2xl border shadow-2xl backdrop-blur-2xl flex flex-col gap-3 p-4 ${theme === "dark" ? "bg-slate-900/95 border-slate-700" : "bg-white/95 border-slate-200"}`}
                    style={{ maxHeight: "380px", overflowY: "auto" }}>
                    <div className={`flex items-center gap-1 p-1 rounded-xl ${theme === "dark" ? "bg-slate-800" : "bg-slate-100"}`}>
                      {TABS.map((tab) => (
                        <button key={tab.key} onClick={() => { setActiveTab(tab.key); setExpandedTaskId(null); }}
                          className={`flex-1 text-center py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeTab === tab.key ? "bg-[#4F7CFF] text-white shadow" : `${mutedText} hover:text-slate-800 ${theme === "dark" ? "hover:text-slate-100" : ""}`}`}>
                          {tab.label}
                          <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black ${activeTab === tab.key ? "bg-white/20 text-white" : theme === "dark" ? "bg-slate-700 text-slate-300" : "bg-slate-200 text-slate-600"}`}>{tab.count}</span>
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-col gap-2 pr-1">
                      {(tabTaskMap[activeTab] || []).length === 0 ? (
                        <p className={`text-sm text-center py-4 ${mutedText}`}>No {activeTab === "inprogress" ? "in-progress" : activeTab} tasks today.</p>
                      ) : (
                        (tabTaskMap[activeTab] || []).map((task) => (
                          <TaskCard key={task.id} task={task} theme={theme} expandedTaskId={expandedTaskId} setExpandedTaskId={setExpandedTaskId} />
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Date filter history */}
        <div className={`p-6 rounded-3xl border backdrop-blur-xl shadow-xl flex flex-col gap-4 ${cardBg} max-h-[480px]`}>
          <div className="flex justify-between items-center shrink-0">
            <h3 className="text-lg font-bold flex items-center gap-2">📅 View Previous Progress</h3>
            <input type="date" value={selectedDate} max={todayStr}
              onChange={(e) => setSelectedDate(e.target.value)}
              className={`p-2 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-[#4F7CFF]/30 transition ${theme === "dark" ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"}`} />
          </div>
          <div className="grid grid-cols-4 gap-2 text-center shrink-0">
            {[
              { label: "Total", value: selectedProgress.total, cls: theme === "dark" ? "bg-slate-800" : "bg-slate-100" },
              { label: "Done", value: selectedProgress.completed, cls: theme === "dark" ? "bg-emerald-900/30 text-emerald-400" : "bg-emerald-50 text-emerald-600" },
              { label: "Pending", value: selectedProgress.pending, cls: theme === "dark" ? "bg-amber-900/30 text-amber-400" : "bg-amber-50 text-amber-600" },
              { label: "Progress", value: `${selectedProgress.percentage}%`, cls: theme === "dark" ? "bg-[#4F7CFF]/20 text-[#4F7CFF]" : "bg-[#4F7CFF]/10 text-[#4F7CFF]" },
            ].map((s) => (
              <div key={s.label} className={`p-2 rounded-xl ${s.cls}`}>
                <p className="text-[10px] font-bold uppercase opacity-80">{s.label}</p>
                <p className="text-lg font-black">{s.value}</p>
              </div>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto pr-2">
            <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${mutedText}`}>✅ Completed Tasks</h4>
            {selectedCompletedTasks.length === 0 ? (
              <p className={`text-sm text-center py-4 ${mutedText}`}>No tasks completed on this date.</p>
            ) : (
              <ul className="space-y-2">
                {selectedCompletedTasks.map((t) => (
                  <li key={t.id} className={`p-3 rounded-xl border flex items-center gap-3 ${theme === "dark" ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-100"}`}>
                    <span className="text-emerald-500 font-bold">✔</span>
                    <span className={`text-sm font-medium line-through opacity-70 ${textColor}`}>{t.title}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>



      {/* ── Activity History ── */}
      <div className={`p-6 rounded-3xl border backdrop-blur-xl shadow-xl flex flex-col gap-6 ${cardBg}`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-xl font-bold flex items-center gap-2">📊 Activity History</h3>
          <div className={`flex items-center p-1 rounded-full ${theme === "dark" ? "bg-slate-800" : "bg-slate-100"}`}>
            {["3 Days", "7 Days", "10 Days", "Custom"].map((r) => (
              <button key={r} onClick={() => setSelectedRange(r)}
                className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all cursor-pointer ${selectedRange === r ? "bg-[#4F7CFF] text-white shadow-md" : `${mutedText} hover:text-slate-800`}`}>
                {r}
              </button>
            ))}
          </div>
        </div>

        {selectedRange === "Custom" && (
          <div className="flex flex-wrap items-center gap-4">
            {[
              { label: "Start", val: customStart, set: setCustomStart, max: customEnd || todayStr },
              { label: "End", val: customEnd, set: setCustomEnd, min: customStart, max: todayStr },
            ].map((p) => (
              <div key={p.label} className="flex items-center gap-2">
                <label className={`text-xs font-bold uppercase ${mutedText}`}>{p.label}:</label>
                <input type="date" value={p.val} min={p.min} max={p.max}
                  onChange={(e) => p.set(e.target.value)}
                  className={`p-2 rounded-xl text-sm border focus:outline-none ${theme === "dark" ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`} />
              </div>
            ))}
          </div>
        )}

        {/* Range stats */}
        <div className={`p-4 rounded-2xl border flex flex-col md:flex-row justify-between items-center gap-4 ${theme === "dark" ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-100"}`}>
          <div>
            <p className={`text-sm font-bold ${textColor}`}>Range: {selectedRange}</p>
            <p className={`text-xs ${mutedText}`}>{filteredHistoryTasks.length} total tasks</p>
          </div>
          <div className="flex items-center gap-6 text-center">
            {[
              { label: "Total", value: historyStats.total, color: textColor },
              { label: "Completed", value: historyStats.completed, color: "text-emerald-500" },
              { label: "Pending", value: historyStats.pending, color: "text-amber-500" },
              { label: "Completion Rate", value: `${historyStats.percentage}%`, color: "text-[#4F7CFF]" },
            ].map((s) => (
              <div key={s.label}>
                <p className={`text-[10px] font-bold uppercase ${mutedText}`}>{s.label}</p>
                <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Daily list */}
        <div className="flex flex-col gap-6">
          {historyByDate.length === 0 ? (
            <div className={`text-center py-8 text-sm ${mutedText}`}>🫧 No activity in the selected range.</div>
          ) : (
            historyByDate.map((dayData, index) => {
              const dObj = new Date(dayData.date);
              const dateLabel = new Date(dObj.getTime() + dObj.getTimezoneOffset() * 60000)
                .toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
              return (
                <div key={dayData.date} className={index !== historyByDate.length - 1 ? `border-b pb-6 ${theme === "dark" ? "border-slate-800" : "border-slate-100"}` : ""}>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className={`font-bold ${textColor}`}>{dateLabel}</h4>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${theme === "dark" ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"}`}>
                      {dayData.percentage}% done
                    </span>
                  </div>
                  {dayData.tasks.length === 0 ? (
                    <p className={`text-sm ${mutedText} italic`}>No completed tasks.</p>
                  ) : (
                    <ul className="space-y-2 pl-2">
                      {dayData.tasks.map((t) => (
                        <li key={t.id} className="flex items-center gap-3">
                          <span className="text-emerald-500 font-bold">✔</span>
                          <span className={`text-sm ${textColor}`}>{t.title}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
