import { useState, useMemo } from "react";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

/**
 * CalendarPanel — mini calendar with task deadline highlights.
 * Props: tasks, theme, onClose
 */
export default function CalendarPanel({ tasks, theme }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const isDark = theme === "dark";
  const textColor = isDark ? "text-slate-100" : "text-slate-800";
  const mutedText = isDark ? "text-slate-500" : "text-slate-400";

  const todayStr = today.toISOString().split("T")[0];

  // Build calendar grid
  const { days, startPad } = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    return { days: Array.from({ length: daysInMonth }, (_, i) => i + 1), startPad: firstDay };
  }, [viewYear, viewMonth]);

  // Map dates to tasks
  const tasksByDate = useMemo(() => {
    const map = {};
    tasks.forEach((t) => {
      if (!t.dueDate) return;
      if (!map[t.dueDate]) map[t.dueDate] = [];
      map[t.dueDate].push(t);
    });
    return map;
  }, [tasks]);

  const [selectedDay, setSelectedDay] = useState(null);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
    setSelectedDay(null);
  };
  const goToday = () => { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()); setSelectedDay(today.getDate()); };

  const selectedDateStr = selectedDay
    ? `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`
    : null;
  const selectedTasks = selectedDateStr ? (tasksByDate[selectedDateStr] || []) : [];

  const getDateStr = (day) =>
    `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const getPriorityColor = (tasks) => {
    if (!tasks || tasks.length === 0) return null;
    if (tasks.some((t) => t.priority === "High" && !t.completed)) return "#dc2626";
    if (tasks.some((t) => t.priority === "Medium" && !t.completed)) return "#ea580c";
    if (tasks.some((t) => !t.completed)) return "#16a34a";
    return "#10b981"; // all completed
  };

  return (
    <div className="select-none">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition ${isDark ? "hover:bg-slate-700 text-slate-300" : "hover:bg-slate-100 text-slate-600"}`}>
          ‹
        </button>
        <div className="text-center">
          <p className={`text-base font-extrabold ${textColor}`}>{MONTHS[viewMonth]} {viewYear}</p>
          <button onClick={goToday} className="text-[10px] font-semibold text-[#4F7CFF] hover:underline cursor-pointer">Today</button>
        </div>
        <button onClick={nextMonth} className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition ${isDark ? "hover:bg-slate-700 text-slate-300" : "hover:bg-slate-100 text-slate-600"}`}>
          ›
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS_OF_WEEK.map((d) => (
          <div key={d} className={`text-center text-[10px] font-bold uppercase py-1 ${mutedText}`}>{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {/* Padding cells */}
        {Array.from({ length: startPad }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}

        {/* Day cells */}
        {days.map((day) => {
          const dateStr = getDateStr(day);
          const dayTasks = tasksByDate[dateStr] || [];
          const dotColor = getPriorityColor(dayTasks);
          const isToday = dateStr === todayStr;
          const isSelected = selectedDay === day;
          const hasTasks = dayTasks.length > 0;

          return (
            <button
              key={day}
              onClick={() => setSelectedDay(isSelected ? null : day)}
              className={`relative flex flex-col items-center justify-center rounded-xl py-1.5 text-sm font-semibold cursor-pointer transition-all duration-150
                ${isSelected
                  ? "bg-[#4F7CFF] text-white shadow-md"
                  : isToday
                    ? isDark ? "bg-slate-700 text-white ring-1 ring-[#4F7CFF]" : "bg-[#EEF4FF] text-[#4F7CFF] ring-1 ring-[#4F7CFF]"
                    : isDark
                      ? "text-slate-300 hover:bg-slate-700"
                      : "text-slate-700 hover:bg-slate-100"
                }`}
            >
              {day}
              {hasTasks && (
                <div
                  className="w-1.5 h-1.5 rounded-full mt-0.5"
                  style={{ backgroundColor: isSelected ? "rgba(255,255,255,0.8)" : (dotColor || "#4F7CFF") }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-3 px-1">
        {[
          { color: "#dc2626", label: "High priority" },
          { color: "#ea580c", label: "Medium" },
          { color: "#16a34a", label: "Low / Done" },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: l.color }} />
            <span className={`text-[9px] ${mutedText}`}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* Selected day tasks */}
      {selectedDateStr && (
        <div className={`mt-4 pt-4 border-t ${isDark ? "border-slate-700" : "border-slate-100"}`}>
          <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${mutedText}`}>
            {selectedDay} {MONTHS[viewMonth]} — {selectedTasks.length} task{selectedTasks.length !== 1 ? "s" : ""}
          </p>
          {selectedTasks.length === 0 ? (
            <p className={`text-sm text-center py-3 ${mutedText}`}>No tasks on this day.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {selectedTasks.map((t) => (
                <li key={t.id}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border ${isDark ? "bg-slate-800/60 border-slate-700" : "bg-white border-slate-100"}`}>
                  <span className="text-sm">{t.completed ? "✅" : t.priority === "High" ? "🔥" : t.priority === "Low" ? "🌱" : "⚡"}</span>
                  <span className={`text-sm font-medium flex-1 ${isDark ? "text-slate-100" : "text-slate-800"} ${t.completed ? "line-through opacity-60" : ""}`}>{t.title}</span>
                  {t.time && <span className={`text-[10px] ${mutedText}`}>{t.time}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
