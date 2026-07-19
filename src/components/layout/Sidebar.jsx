import { useState, useMemo } from "react";
import Tooltip from "../Tooltip";

function Sidebar({
  theme,
  tasks,
  activeCategory,
  setActiveCategory,
  selectedDate,
  setSelectedDate,
  priorityFilter,
  setPriorityFilter,
  onAddTask,
  onOpenWhatsNew,
  onOpenFeatures,
}) {
  const [navDate, setNavDate] = useState(() => new Date());

  const calendarDays = useMemo(() => {
    const year = navDate.getFullYear();
    const month = navDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    const days = [];

    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        day: prevMonthTotalDays - i,
        isCurrentMonth: false,
        dateString: `${month === 0 ? year - 1 : year}-${String(month === 0 ? 12 : month).padStart(2, "0")}-${String(prevMonthTotalDays - i).padStart(2, "0")}`,
      });
    }

    for (let i = 1; i <= totalDays; i++) {
      days.push({
        day: i,
        isCurrentMonth: true,
        dateString: `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`,
      });
    }

    const remainingCells = 42 - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        dateString: `${month === 11 ? year + 1 : year}-${String(month === 11 ? 1 : month + 2).padStart(2, "0")}-${String(i).padStart(2, "0")}`,
      });
    }

    return days;
  }, [navDate]);

  const todayStr = new Date().toISOString().split("T")[0];
  const focusCount = tasks.filter((t) => !t.completed && t.isFocused && t.dueDate === selectedDate).length;
  const myTasksCount = tasks.filter((t) => !t.completed).length;
  const priorityCount = tasks.filter((t) => !t.completed && t.dueDate === todayStr).length;
  const calendarCount = tasks.filter((t) => !t.completed && t.dueDate === selectedDate).length;
  const dashboardCount = tasks.filter((t) => !t.completed && t.dueDate === todayStr).length;

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const handlePrevMonth = () => {
    setNavDate(new Date(navDate.getFullYear(), navDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setNavDate(new Date(navDate.getFullYear(), navDate.getMonth() + 1, 1));
  };

  const readableSelectedDate = useMemo(() => {
    const [y, m, d] = selectedDate.split("-");
    const dateObj = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
    if (isNaN(dateObj.getTime())) return selectedDate;
    return dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [selectedDate]);

  const categories = [
    { name: "Dashboard", icon: "📊", badge: dashboardCount },
    { name: "Calendar", icon: "📅", badge: calendarCount },
    { name: "Focus Tasks", icon: "⭐", badge: focusCount },
    { name: "My Tasks", icon: "🫧", badge: myTasksCount },
    { name: "Priority Queue", icon: "⚡", badge: priorityCount },
    { name: "Progress Tracker", icon: "📈", badge: null },
    { name: "Settings", icon: "⚙️", badge: null },
  ];

  const inactiveCategoryClasses = theme === "dark"
    ? "text-slate-300 hover:bg-slate-800/80 hover:text-slate-100 border-l-4 border-transparent"
    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-l-4 border-transparent";
  const panelCardBg = theme === "dark"
    ? "bg-slate-900/80 border-slate-700"
    : "bg-slate-50/80 border-slate-100";
  const miniCalendarBg = theme === "dark"
    ? "bg-slate-900/80 border-slate-700"
    : "bg-slate-50/50 border-slate-100/60";
  const miniCalendarButton = theme === "dark"
    ? "border-slate-700 text-slate-100 hover:bg-slate-800"
    : "border-slate-200 text-slate-600 hover:bg-white";
  const normalDayText = theme === "dark"
    ? "text-slate-300 hover:bg-slate-800 hover:text-slate-100"
    : "text-slate-700 hover:bg-white hover:shadow-sm";
  const mutedDayText = theme === "dark"
    ? "text-slate-500 hover:bg-slate-800 hover:text-slate-200"
    : "text-slate-400 hover:bg-white";
  const selectedDateText = theme === "dark" ? "text-slate-400" : "text-slate-500";

  return (
    <div className={`w-80 border-r p-5 flex flex-col justify-between h-full select-none ${
      theme === "dark"
        ? "border-slate-700 bg-slate-950/90 text-slate-100"
        : "border-slate-200 bg-white/70 text-slate-900"
    }`}>
      <div className="flex flex-col gap-6 overflow-y-auto max-h-[85vh] pr-1">
        <Tooltip content="Create a new task" className="w-full">
          <button
            onClick={onAddTask}
            className="w-full rounded-2xl bg-gradient-to-r from-[#4F7CFF] to-[#7c3aed] px-4 py-3.5 text-base font-semibold text-white shadow-md shadow-[#4F7CFF]/20 hover:shadow-lg hover:shadow-[#4F7CFF]/30 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>✨</span>
            <span>New Floating Task</span>
          </button>
        </Tooltip>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">Navigation</label>
          {categories.map((cat) => {
            const isActive = activeCategory === cat.name;
            return (
              <Tooltip key={cat.name} content={`View ${cat.name}`} className="w-full">
                <button
                  onClick={() => setActiveCategory(cat.name)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-gradient-to-r from-[#4F7CFF]/15 to-[#7c3aed]/15 text-[#4F7CFF] border-l-4 border-[#4F7CFF] font-semibold"
                      : inactiveCategoryClasses
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{cat.icon}</span>
                    <span>{cat.name}</span>
                  </div>
                  {cat.badge !== null && cat.badge > 0 && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isActive
                        ? "bg-[#4F7CFF] text-white"
                        : theme === "dark"
                          ? "bg-slate-700 text-slate-200"
                          : "bg-slate-100 text-slate-500"
                    }`}>
                      {cat.badge}
                    </span>
                  )}
                </button>
              </Tooltip>
            );
          })}
        </div>

        {activeCategory === "Priority Queue" && (
          <div className={`${panelCardBg} p-3 rounded-2xl border flex flex-col gap-2.5 animate-fadeIn`}>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Priority Filters</span>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { filter: "all", label: "All Priority", color: "bg-slate-200 text-slate-700" },
                { filter: "High", label: "🔥 High", color: "bg-red-100 text-red-700 border-red-200" },
                { filter: "Medium", label: "⚡ Medium", color: "bg-amber-100 text-amber-700 border-amber-200" },
                { filter: "Low", label: "🌱 Low", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
              ].map((p) => {
                const isFilterActive = priorityFilter.toLowerCase() === p.filter.toLowerCase();
                return (
                  <Tooltip key={p.filter} content={`Filter by ${p.filter} priority`} className="w-full">
                    <button
                      onClick={() => setPriorityFilter(p.filter)}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer text-center ${
                        isFilterActive
                          ? `${p.color} border-current shadow-sm scale-[1.02]`
                          : "bg-white border-slate-200 text-slate-500 hover:bg-slate-100"
                      }`}
                    >
                      {p.label}
                    </button>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        )}
      {activeCategory === "Calendar" && (
        <div className={`${miniCalendarBg} p-4 rounded-2xl border flex flex-col gap-3`}>
          <div className="flex items-center justify-between">
            <Tooltip content="Previous month">
              <button
                onClick={handlePrevMonth}
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition cursor-pointer border ${miniCalendarButton}`}
              >
                &lt;
              </button>
            </Tooltip>
            <span className={`text-xs font-extrabold ${theme === "dark" ? "text-slate-100" : "text-slate-700"}`}>
              {monthNames[navDate.getMonth()]} {navDate.getFullYear()}
            </span>
            <Tooltip content="Next month">
              <button
                onClick={handleNextMonth}
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition cursor-pointer border ${miniCalendarButton}`}
              >
                &gt;
              </button>
            </Tooltip>
          </div>

          <div className="grid grid-cols-7 text-center text-[9px] font-black text-slate-400">
            <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((d, index) => {
              const isSelected = d.dateString === selectedDate;
              return (
                <Tooltip key={`${d.dateString}-${index}`} content={`View ${d.dateString}`}>
                  <button
                    onClick={() => {
                      setSelectedDate(d.dateString);
                      if (activeCategory !== "Focus Tasks" && activeCategory !== "Calendar") {
                        setActiveCategory("Calendar");
                      }
                    }}
                    className={`aspect-square w-7 rounded-lg text-[10px] font-semibold flex items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#4F7CFF] text-white shadow-md shadow-[#4F7CFF]/30 font-bold"
                        : d.isCurrentMonth
                        ? normalDayText
                        : mutedDayText
                    }`}
                  >
                    {d.day}
                  </button>
                </Tooltip>
              );
            })}
          </div>

          <div className={`border-t ${theme === "dark" ? "border-slate-700" : "border-slate-200/60"} pt-2 flex items-center justify-between text-[10px] ${selectedDateText} font-bold`}>
            <span>Selected Date:</span>
            <span className="text-[#4F7CFF] font-extrabold">{readableSelectedDate}</span>
          </div>
        </div>
        )}
      </div>

      <div className={`pt-2 border-t ${theme === "dark" ? "border-slate-700" : "border-slate-200"} flex flex-col gap-2 shrink-0`}>
        <div className="flex items-center justify-center gap-3.5 text-xs font-semibold">
          <button 
            onClick={onOpenWhatsNew} 
            className={`transition cursor-pointer ${
              theme === "dark" ? "text-slate-400 hover:text-[#4F7CFF]" : "text-slate-500 hover:text-[#4F7CFF]"
            }`}
          >
            What's New
          </button>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <button 
            onClick={onOpenFeatures} 
            className={`transition cursor-pointer ${
              theme === "dark" ? "text-slate-400 hover:text-[#4F7CFF]" : "text-slate-500 hover:text-[#4F7CFF]"
            }`}
          >
            Features
          </button>
        </div>
        <div className={`text-center text-[10px] ${theme === "dark" ? "text-slate-400" : "text-slate-500"} font-medium flex items-center justify-center gap-1`}>
          <span>BubbleSpace OS</span>
          <span>•</span>
          <span>v1.2.0</span>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
