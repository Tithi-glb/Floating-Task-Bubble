import { useState, useMemo, useRef, useEffect } from "react";

// ─── Helper Functions ───────────────────────────────────────────────────────

const getTodayString = () => new Date().toISOString().split("T")[0];

const getProgressByDate = (tasks, dateString) => {
  const dateTasks = tasks.filter((t) => t.dueDate === dateString);
  const total = dateTasks.length;
  const completed = dateTasks.filter((t) => t.completed).length;
  const pending = total - completed;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { total, completed, pending, percentage };
};

const getCompletedTasksByDate = (tasks, dateString) =>
  tasks.filter((t) => t.dueDate === dateString && t.completed);

const getTasksForRange = (tasks, rangeDays) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() - rangeDays + 1);
  return tasks.filter((t) => {
    if (!t.dueDate) return false;
    const taskDate = new Date(t.dueDate);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate >= cutoff && taskDate <= today;
  });
};

const getTasksForCustomRange = (tasks, startDateStr, endDateStr) => {
  if (!startDateStr || !endDateStr) return [];
  const start = new Date(startDateStr);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDateStr);
  end.setHours(0, 0, 0, 0);
  return tasks.filter((t) => {
    if (!t.dueDate) return false;
    const taskDate = new Date(t.dueDate);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate >= start && taskDate <= end;
  });
};

const getCompletionStats = (filteredTasks) => {
  const total = filteredTasks.length;
  const completed = filteredTasks.filter((t) => t.completed).length;
  const pending = total - completed;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { total, completed, pending, percentage };
};

const getLongestStreak = (filteredTasks) => {
  const completedByDate = {};
  filteredTasks.forEach((t) => {
    if (t.completed && t.dueDate) completedByDate[t.dueDate] = true;
  });
  const sortedDates = Object.keys(completedByDate).sort();
  if (sortedDates.length === 0) return 0;
  let longest = 1;
  let current = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    const diffDays = Math.ceil(
      Math.abs(new Date(sortedDates[i]) - new Date(sortedDates[i - 1])) /
      (1000 * 60 * 60 * 24)
    );
    if (diffDays === 1) {
      current++;
      if (current > longest) longest = current;
    } else {
      current = 1;
    }
  }
  return longest;
};

const getMostProductiveDay = (filteredTasks) => {
  const completedByDate = {};
  filteredTasks.forEach((t) => {
    if (t.completed && t.dueDate)
      completedByDate[t.dueDate] = (completedByDate[t.dueDate] || 0) + 1;
  });
  let max = 0;
  let bestDay = null;
  Object.entries(completedByDate).forEach(([date, count]) => {
    if (count > max) { max = count; bestDay = date; }
  });
  if (!bestDay) return { date: null, count: 0 };
  const dObj = new Date(bestDay);
  const dStr = new Date(dObj.getTime() + dObj.getTimezoneOffset() * 60000).toLocaleDateString(
    "en-US",
    { weekday: "short", month: "short", day: "numeric" }
  );
  return { date: dStr, count: max };
};

// ─── Today's Task Helpers ────────────────────────────────────────────────────

const calculateTaskProgress = (task) => {
  if (!task.subtasks || task.subtasks.length === 0) return task.completed ? 100 : 0;
  const done = task.subtasks.filter((s) => s.done).length;
  return Math.round((done / task.subtasks.length) * 100);
};

const getTodaysTasks = (tasks) => {
  const today = getTodayString();
  return tasks.filter((t) => t.dueDate === today);
};

const getCompletedTasks = (tasks) =>
  getTodaysTasks(tasks).filter((t) => t.completed);

const getPendingTasks = (tasks) =>
  getTodaysTasks(tasks).filter(
    (t) => !t.completed && calculateTaskProgress(t) === 0
  );

const getInProgressTasks = (tasks) =>
  getTodaysTasks(tasks).filter(
    (t) => !t.completed && calculateTaskProgress(t) > 0
  );

// ─── Sub-components ──────────────────────────────────────────────────────────

const PieChartBubble = ({ percentage, theme }) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  return (
    <div className="relative flex items-center justify-center w-24 h-24">
      <svg className="w-full h-full transform -rotate-90">
        <circle cx="48" cy="48" r={radius} stroke={theme === "dark" ? "#1e293b" : "#e2e8f0"} strokeWidth="8" fill="none" />
        <circle cx="48" cy="48" r={radius} stroke="#4F7CFF" strokeWidth="8" fill="none"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" className="transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className={`text-lg font-bold ${theme === "dark" ? "text-white" : "text-slate-800"}`}>{percentage}%</span>
      </div>
    </div>
  );
};

const PRIORITY_BADGE = {
  High: "bg-red-100 text-red-600 border-red-200",
  Medium: "bg-amber-100 text-amber-600 border-amber-200",
  Low: "bg-emerald-100 text-emerald-600 border-emerald-200",
};

const TaskCard = ({ task, theme, expandedTaskId, setExpandedTaskId }) => {
  const progress = calculateTaskProgress(task);
  const subtaskCount = task.subtasks?.length || 0;
  const isExpanded = expandedTaskId === task.id;
  const textColor = theme === "dark" ? "text-slate-100" : "text-slate-800";
  const mutedText = theme === "dark" ? "text-slate-400" : "text-slate-500";

  const formattedDue = (() => {
    if (!task.dueDate) return "—";
    const [y, m, d] = task.dueDate.split("-");
    const dateLabel = new Date(+y, +m - 1, +d).toLocaleDateString("en-US", {
      day: "numeric", month: "short",
    });
    return task.time ? `${dateLabel}, ${task.time}` : dateLabel;
  })();

  return (
    <div className={`rounded-xl border p-3 flex flex-col gap-2 transition-all ${theme === "dark" ? "bg-slate-800/60 border-slate-700" : "bg-white border-slate-200"}`}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-sm">📌</span>
          <span className={`text-sm font-semibold truncate ${textColor} ${task.completed ? "line-through opacity-60" : ""}`}>{task.title}</span>
        </div>
        <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${PRIORITY_BADGE[task.priority] || PRIORITY_BADGE.Medium}`}>
          {task.priority || "Medium"}
        </span>
      </div>

      {/* Meta row */}
      <div className={`flex flex-wrap items-center gap-3 text-[11px] ${mutedText}`}>
        <span>🕐 {formattedDue}</span>
        <span>⚡ {progress}%</span>
        {subtaskCount > 0 && <span>📎 {subtaskCount} subtask{subtaskCount !== 1 ? "s" : ""}</span>}
      </div>

      {/* Mini progress bar */}
      <div className={`w-full h-1.5 rounded-full overflow-hidden ${theme === "dark" ? "bg-slate-700" : "bg-slate-100"}`}>
        <div
          className={`h-full rounded-full transition-all duration-700 ${task.completed ? "bg-emerald-500" : "bg-gradient-to-r from-[#4F7CFF] to-[#7c3aed]"}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Subtask toggle */}
      {subtaskCount > 0 && (
        <button
          onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
          className={`self-start text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer ${theme === "dark" ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-800"}`}
        >
          <span className="text-[9px]">{isExpanded ? "▲" : "▼"}</span>
          {isExpanded ? "Hide Subtasks" : "View Subtasks"}
        </button>
      )}

      {/* Subtask list */}
      {isExpanded && subtaskCount > 0 && (
        <ul className="flex flex-col gap-1.5 pl-2 pt-1 border-t border-dashed border-slate-200 dark:border-slate-700 mt-1">
          {task.subtasks.map((s) => (
            <li key={s.id} className={`flex items-center gap-2 text-xs ${s.done ? (theme === "dark" ? "text-emerald-400" : "text-emerald-600") : mutedText}`}>
              <span>{s.done ? "✔" : "○"}</span>
              <span className={s.done ? "line-through opacity-70" : ""}>{s.text}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ProgressTracker({ tasks, theme }) {
  const todayString = getTodayString();
  const todayProgress = getProgressByDate(tasks, todayString);

  // Single-day view
  const [selectedDate, setSelectedDate] = useState(todayString);
  const selectedDateProgress = getProgressByDate(tasks, selectedDate);
  const selectedDateCompletedTasks = getCompletedTasksByDate(tasks, selectedDate);

  // Activity history
  const [selectedRange, setSelectedRange] = useState("7 Days");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // Today's detail panel
  const [showTodayDetails, setShowTodayDetails] = useState(false);
  const [activeTab, setActiveTab] = useState("completed");
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const dropdownRef = useRef(null);

  // Close overlay on click-outside
  useEffect(() => {
    if (!showTodayDetails) return;
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowTodayDetails(false);
        setExpandedTaskId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showTodayDetails]);

  // Derived: today's task groups (recalculated whenever tasks change)
  const todayCompletedTasks = useMemo(() => getCompletedTasks(tasks), [tasks]);
  const todayPendingTasks = useMemo(() => getPendingTasks(tasks), [tasks]);
  const todayInProgressTasks = useMemo(() => getInProgressTasks(tasks), [tasks]);

  const tabTaskMap = {
    completed: todayCompletedTasks,
    pending: todayPendingTasks,
    inprogress: todayInProgressTasks,
  };
  const activeTaskList = tabTaskMap[activeTab] || [];

  // Activity history
  const filteredHistoryTasks = useMemo(() => {
    if (selectedRange === "Custom")
      return getTasksForCustomRange(tasks, customStartDate, customEndDate);
    const days = parseInt(selectedRange.split(" ")[0]);
    return getTasksForRange(tasks, days);
  }, [tasks, selectedRange, customStartDate, customEndDate]);

  const historyStats = useMemo(() => getCompletionStats(filteredHistoryTasks), [filteredHistoryTasks]);
  const longestStreak = useMemo(() => getLongestStreak(filteredHistoryTasks), [filteredHistoryTasks]);
  const mostProductive = useMemo(() => getMostProductiveDay(filteredHistoryTasks), [filteredHistoryTasks]);

  const historyByDate = useMemo(() => {
    const grouped = {};
    filteredHistoryTasks.forEach((t) => {
      if (!t.dueDate) return;
      if (!grouped[t.dueDate]) grouped[t.dueDate] = { total: 0, completed: 0, tasks: [] };
      grouped[t.dueDate].total++;
      if (t.completed) {
        grouped[t.dueDate].completed++;
        grouped[t.dueDate].tasks.push(t);
      }
    });
    return Object.keys(grouped)
      .sort((a, b) => new Date(b) - new Date(a))
      .map((date) => ({
        date,
        ...grouped[date],
        percentage: Math.round((grouped[date].completed / grouped[date].total) * 100),
      }));
  }, [filteredHistoryTasks]);

  // Theme aliases
  const cardBg = theme === "dark" ? "bg-slate-900/80 border-slate-700" : "bg-white/80 border-slate-200";
  const textColor = theme === "dark" ? "text-slate-100" : "text-slate-800";
  const mutedText = theme === "dark" ? "text-slate-400" : "text-slate-500";

  const allDoneToday = todayProgress.total > 0 && todayProgress.percentage === 100;

  const TABS = [
    { key: "completed", label: "🟢 Completed", count: todayCompletedTasks.length },
    { key: "pending", label: "🟡 Pending", count: todayPendingTasks.length },
    { key: "inprogress", label: "🔵 In Progress", count: todayInProgressTasks.length },
  ];

  return (
    <div className={`flex-1 h-full overflow-y-auto p-8 animate-fadeIn ${theme === "dark" ? "text-slate-100" : "text-slate-800"}`}>
      <h2 className="text-2xl font-extrabold mb-6 flex items-center gap-2">
        <span>📈</span> Progress Tracker
      </h2>

      {/* ── Analytics Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { icon: "🔥", label: "Longest Streak", value: `${longestStreak} ${longestStreak === 1 ? "day" : "days"}` },
          {
            icon: "🏆", label: "Most Productive Day",
            value: mostProductive.date
              ? `${mostProductive.date} (${mostProductive.count} tasks)`
              : "None"
          },
          { icon: "📈", label: "Avg Completion Rate", value: `${historyStats.percentage}%` },
        ].map((card) => (
          <div key={card.label} className={`p-4 rounded-2xl border backdrop-blur-xl shadow-sm flex flex-col gap-1 ${cardBg}`}>
            <div className="flex items-center gap-2">
              <span className="text-xl">{card.icon}</span>
              <p className={`text-xs font-bold uppercase tracking-wider ${mutedText}`}>{card.label}</p>
            </div>
            <p className={`text-xl font-extrabold mt-1 pl-7 ${textColor}`}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* ── Today's Progress Card ── */}
        <div className={`p-6 rounded-3xl border backdrop-blur-xl shadow-xl flex flex-col gap-4 relative overflow-visible ${cardBg}`}>
          <h3 className="text-xl font-bold flex items-center gap-2">📊 Today's Progress</h3>

          {allDoneToday && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 p-3 rounded-xl flex items-center gap-2 text-sm font-bold animate-pulse">
              <span>🎉</span> Congratulations! You completed all tasks today.
            </div>
          )}

          {todayProgress.total === 0 ? (
            <div className={`text-center py-8 text-sm ${mutedText}`}>
              <span>🫧</span> No tasks created today.
            </div>
          ) : (
            <>
              {/* Stats + pie */}
              <div className="flex items-center justify-between gap-6">
                <div className="flex-1 space-y-3">
                  {[
                    { label: "Total Tasks", value: todayProgress.total, color: textColor },
                    { label: "Completed", value: todayProgress.completed, color: "text-emerald-500" },
                    { label: "Pending", value: todayProgress.pending, color: "text-amber-500" },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between items-center">
                      <span className={mutedText}>{row.label}:</span>
                      <span className={`font-bold text-lg ${row.color}`}>{row.value}</span>
                    </div>
                  ))}
                  <div className={`w-full h-2 rounded-full overflow-hidden ${theme === "dark" ? "bg-slate-700" : "bg-slate-200"}`}>
                    <div
                      className="bg-gradient-to-r from-[#4F7CFF] to-[#7c3aed] h-full rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${todayProgress.percentage}%` }}
                    />
                  </div>
                </div>
                <PieChartBubble percentage={todayProgress.percentage} theme={theme} />
              </div>

              {/* Toggle button + floating overlay wrapper */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => {
                    setShowTodayDetails((v) => !v);
                    setExpandedTaskId(null);
                  }}
                  className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${showTodayDetails
                      ? "bg-[#4F7CFF] text-white border-[#4F7CFF] shadow-md"
                      : theme === "dark"
                        ? "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                >
                  <span>📋</span>
                  {showTodayDetails ? "Hide Task Details" : "View Today's Task Status"}
                  <span className="ml-1 text-xs">{showTodayDetails ? "▲" : "▼"}</span>
                </button>

                {/* ── Floating overlay dropdown ── */}
                {showTodayDetails && (
                  <div
                    className={`absolute left-0 top-full mt-2 w-full z-50 rounded-2xl border shadow-2xl backdrop-blur-2xl flex flex-col gap-3 p-4 animate-fadeIn ${theme === "dark"
                        ? "bg-slate-900/95 border-slate-700"
                        : "bg-white/95 border-slate-200"
                      }`}
                    style={{ maxHeight: "400px", overflowY: "auto" }}
                  >
                    {/* Tabs */}
                    <div className={`flex items-center gap-1 p-1 rounded-xl shrink-0 ${theme === "dark" ? "bg-slate-800" : "bg-slate-100"
                      }`}>
                      {TABS.map((tab) => (
                        <button
                          key={tab.key}
                          onClick={() => { setActiveTab(tab.key); setExpandedTaskId(null); }}
                          className={`flex-1 text-center py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeTab === tab.key
                              ? "bg-[#4F7CFF] text-white shadow"
                              : `${mutedText} hover:text-slate-900 ${theme === "dark" ? "hover:text-slate-100" : ""}`
                            }`}
                        >
                          {tab.label}
                          <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black ${activeTab === tab.key ? "bg-white/20 text-white" : theme === "dark" ? "bg-slate-700 text-slate-300" : "bg-slate-200 text-slate-600"
                            }`}>{tab.count}</span>
                        </button>
                      ))}
                    </div>

                    {/* Task list */}
                    <div className="flex flex-col gap-2 pr-1">
                      {activeTaskList.length === 0 ? (
                        <p className={`text-sm text-center py-4 ${mutedText}`}>
                          No {activeTab === "inprogress" ? "in-progress" : activeTab} tasks today.
                        </p>
                      ) : (
                        activeTaskList.map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            theme={theme}
                            expandedTaskId={expandedTaskId}
                            setExpandedTaskId={setExpandedTaskId}
                          />
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* ── Date Filter & Completed Task History ── */}
        <div className={`p-6 rounded-3xl border backdrop-blur-xl shadow-xl flex flex-col gap-4 ${cardBg} max-h-96`}>
          <div className="flex justify-between items-center shrink-0">
            <h3 className="text-lg font-bold flex items-center gap-2">📅 View Previous Progress</h3>
            <input
              type="date"
              value={selectedDate}
              max={todayString}
              onChange={(e) => setSelectedDate(e.target.value)}
              className={`p-2 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-[#4F7CFF]/30 transition ${theme === "dark" ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"}`}
            />
          </div>

          <div className="grid grid-cols-4 gap-2 text-center shrink-0">
            {[
              { label: "Total", value: selectedDateProgress.total, cls: theme === "dark" ? "bg-slate-800" : "bg-slate-100" },
              { label: "Done", value: selectedDateProgress.completed, cls: theme === "dark" ? "bg-emerald-900/30 text-emerald-400" : "bg-emerald-50 text-emerald-600" },
              { label: "Pending", value: selectedDateProgress.pending, cls: theme === "dark" ? "bg-amber-900/30 text-amber-400" : "bg-amber-50 text-amber-600" },
              { label: "Progress", value: `${selectedDateProgress.percentage}%`, cls: theme === "dark" ? "bg-[#4F7CFF]/20 text-[#4F7CFF]" : "bg-[#4F7CFF]/10 text-[#4F7CFF]" },
            ].map((stat) => (
              <div key={stat.label} className={`p-2 rounded-xl ${stat.cls}`}>
                <p className={`text-[10px] font-bold uppercase opacity-80`}>{stat.label}</p>
                <p className="text-lg font-black">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto pr-2">
            <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${mutedText}`}>✅ Completed Tasks</h4>
            {selectedDateCompletedTasks.length === 0 ? (
              <p className={`text-sm text-center py-4 ${mutedText}`}>No tasks completed on this date.</p>
            ) : (
              <ul className="space-y-2">
                {selectedDateCompletedTasks.map((t) => (
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
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-xl font-bold flex items-center gap-2">📊 Activity History</h3>
            <div className={`flex items-center p-1 rounded-full ${theme === "dark" ? "bg-slate-800" : "bg-slate-100"}`}>
              {["3 Days", "7 Days", "10 Days", "Custom"].map((range) => (
                <button
                  key={range}
                  onClick={() => setSelectedRange(range)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all cursor-pointer ${selectedRange === range
                      ? "bg-[#4F7CFF] text-white shadow-md"
                      : `${mutedText} ${theme === "dark" ? "hover:text-slate-300" : "hover:text-slate-800"}`
                    }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          {selectedRange === "Custom" && (
            <div className="flex flex-wrap items-center gap-4 animate-fadeIn">
              {[
                {
                  label: "Start Date",
                  value: customStartDate,
                  min: undefined,
                  max: new Date().toUTCString,
                  onChange: setCustomStartDate,
                },

                {
                  label: "End Date",
                  value: customEndDate,
                  min: customStartDatun,
                  max: new Date().toISOString().split("T")[0],
                  onChange: setCustomEndDate,
                },
              ].map((picker) => (
                <div key={picker.label} className="flex items-center gap-2">
                  <label className={`text-xs font-bold uppercase ${mutedText}`}>{picker.label}:</label>
                  <input
                    type="date"
                    value={picker.value}
                    min={picker.min}
                    max={picker.max}
                    onChange={(e) => picker.onChange(e.target.value)}
                    className="..."
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Range stats bar */}
        <div className={`p-4 rounded-2xl border flex flex-col md:flex-row justify-between items-center gap-4 ${theme === "dark" ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-100"}`}>
          <div>
            <p className={`text-sm font-bold ${textColor}`}>Selected Range: {selectedRange}</p>
            <p className={`text-xs ${mutedText}`}>{filteredHistoryTasks.length} total tasks in this period</p>
          </div>
          <div className="flex items-center gap-6 text-center">
            {[
              { label: "Total Tasks", value: historyStats.total, color: textColor },
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

        {/* Daily activity list */}
        <div className="flex flex-col gap-6">
          {historyByDate.length === 0 ? (
            <div className={`text-center py-8 text-sm ${mutedText}`}>
              <span>🫧</span> No activity found for the selected time range.
            </div>
          ) : (
            historyByDate.map((dayData, index) => {
              const dObj = new Date(dayData.date);
              const dateLabel = new Date(
                dObj.getTime() + dObj.getTimezoneOffset() * 60000
              ).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
              return (
                <div
                  key={dayData.date}
                  className={index !== historyByDate.length - 1 ? `border-b pb-6 ${theme === "dark" ? "border-slate-800" : "border-slate-100"}` : ""}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h4 className={`font-bold ${textColor}`}>{dateLabel}</h4>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${theme === "dark" ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"}`}>
                      Completion: {dayData.percentage}%
                    </span>
                  </div>
                  {dayData.tasks.length === 0 ? (
                    <p className={`text-sm ${mutedText} italic`}>No completed tasks on this date.</p>
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
