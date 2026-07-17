import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Bubble from "../bubbles/Bubble";

const positions = [
  { top: "10%", left: "10%" },
  { top: "55%", left: "20%" },
  { top: "20%", left: "50%" },
  { top: "65%", left: "70%" },
  { top: "35%", left: "80%" },
  { top: "75%", left: "45%" },
];

function formatDate(dateStr) {
  if (!dateStr) return "No date";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatTime(timeStr) {
  if (!timeStr) return "";
  const [hour, minute] = timeStr.split(":");
  const h = parseInt(hour, 10);
  if (Number.isNaN(h)) return timeStr;
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${minute} ${ampm}`;
}

function PreviewPanel({
  theme,
  tasks,
  allTasks,
  activeCategory,
  isDesktopMode,
  isModalOpen,
  focusMode,
  setFocusMode,
  onEdit,
  onDelete,
  onComplete,
  onToggleFocus,
  onToggleSubtask,
  onFocusTask,
  onAddTask,
}) {
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickFilter, setQuickFilter] = useState("All");
  const [quickSearch, setQuickSearch] = useState("");
  const [focusedTaskId, setFocusedTaskId] = useState(null);
  const [activeTooltipTaskId, setActiveTooltipTaskId] = useState(null);
  const [isFloatingButtonActive, setIsFloatingButtonActive] = useState(false);
  const [buttonTooltip, setButtonTooltip] = useState(null);
  const [isCanvasHovered, setIsCanvasHovered] = useState(false);
  const panelRef = useRef(null);
  const buttonRef = useRef(null);
  const plusButtonRef = useRef(null);
  const floatingButtonGroupRef = useRef(null);
  const bubbleWrapperRef = useRef(null);

  const isAllTasksEmpty = allTasks.length === 0;
  const hasNoFilteredTasks = tasks.length === 0 && !isAllTasksEmpty;
  const emptyStateTitle = isAllTasksEmpty
    ? "Welcome to Floating Task Bubble"
    : activeCategory === "Focus Tasks"
      ? "No focus tasks found for this date"
      : activeCategory === "Priority Queue"
        ? "No priority tasks due today"
        : activeCategory === "Calendar"
          ? "No tasks scheduled for this date"
          : "No matching tasks in this view";
  const emptyStateSubtitle = isAllTasksEmpty
    ? "Manage your tasks with beautiful floating bubbles. Stay organized, focused, and productive."
    : "Try another date, change the filter, or create a new task to fill this space.";

  const pendingTasks = useMemo(
    () => allTasks.filter((task) => !task.completed),
    [allTasks]
  );

  const filteredQuickTasks = useMemo(() => {
    return allTasks
      .filter((task) => {
        if (quickFilter !== "All" && task.priority !== quickFilter) {
          return false;
        }
        return task.title.toLowerCase().includes(quickSearch.toLowerCase());
      })
      .sort((a, b) => {
        if (a.priority === b.priority) {
          return new Date(`${a.dueDate}T${a.time}:00`) - new Date(`${b.dueDate}T${b.time}:00`);
        }
        const order = { High: -1, Medium: 0, Low: 1 };
        return order[a.priority] - order[b.priority];
      });
  }, [allTasks, quickFilter, quickSearch]);

  useEffect(() => {
    if (!quickOpen) return;

    const handleOutsideClick = (event) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target) &&
        floatingButtonGroupRef.current &&
        !floatingButtonGroupRef.current.contains(event.target)
      ) {
        setQuickOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setQuickOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [quickOpen]);

  useEffect(() => {
    if (!activeTooltipTaskId) return;

    const handleOutsideClick = (event) => {
      if (
        bubbleWrapperRef.current &&
        !bubbleWrapperRef.current.contains(event.target)
      ) {
        setActiveTooltipTaskId(null);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setActiveTooltipTaskId(null);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [activeTooltipTaskId]);

  return (
    <div
      ref={bubbleWrapperRef}
      onMouseEnter={() => setIsCanvasHovered(true)}
      onMouseLeave={() => setIsCanvasHovered(false)}
      className={
        `
        flex-1
        relative
        overflow-hidden
        transition-all
        duration-500
        ${isDesktopMode
          ? "bg-transparent"
          : theme === "dark"
            ? "bg-slate-950 text-slate-100"
            : "bg-linear-to-br from-[#F4F8FF] via-[#EAF2FF] to-[#F3E8FF]"
        }
        ${isModalOpen ? "opacity-80" : "opacity-100"}
      `
      }
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            theme === "dark"
              ? "radial-gradient(circle at top left, rgba(96,165,250,0.08) 0%, transparent 35%), radial-gradient(circle at bottom right, rgba(148,163,184,0.12) 0%, transparent 45%)"
              : "radial-gradient(circle at top left, rgba(79,124,255,0.15) 0%, transparent 35%), radial-gradient(circle at bottom right, rgba(243,232,255,0.7) 0%, transparent 45%)",
        }}
      />

      <div className="absolute top-16 left-16 w-10 h-10 rounded-full bg-[#4F7CFF]/15 blur-sm" />
      <div className="absolute top-32 right-24 w-20 h-20 rounded-full bg-[#DCEEFF]/70 blur-md" />
      <div className="absolute bottom-24 left-1/3 w-14 h-14 rounded-full bg-[#F3E8FF]/80 blur-md" />
      <div className="absolute top-1/2 right-1/4 w-8 h-8 rounded-full bg-[#4F7CFF]/20 blur-sm" />
      <div className="absolute bottom-12 right-20 w-24 h-24 rounded-full bg-white/70 blur-lg" />

      <motion.div
        ref={floatingButtonGroupRef}
        drag
        dragMomentum={false}
        dragElastic={0.15}
        onMouseEnter={() => setIsFloatingButtonActive(true)}
        onMouseLeave={() => {
          setIsFloatingButtonActive(false);
          setButtonTooltip(null);
        }}
        className="absolute top-6 right-6 z-50 flex items-center gap-3"
        style={{ touchAction: "none" }}
      >
        <AnimatePresence>
          {isFloatingButtonActive && (
            <motion.button
              ref={plusButtonRef}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAddTask();
              }}
              onMouseEnter={() => setButtonTooltip("add")}
              onMouseLeave={() => setButtonTooltip(null)}
              onFocus={() => {
                setIsFloatingButtonActive(true);
                setButtonTooltip("add");
              }}
              onBlur={() => {
                window.setTimeout(() => {
                  if (
                    document.activeElement !== buttonRef.current &&
                    document.activeElement !== plusButtonRef.current
                  ) {
                    setIsFloatingButtonActive(false);
                    setButtonTooltip(null);
                  }
                }, 0);
              }}
              className="relative flex h-[52px] w-[52px] items-center justify-center rounded-full border border-slate-200 bg-white/95 shadow-xl backdrop-blur-xl text-xl text-slate-900 transition-transform duration-200 hover:scale-105 hover:shadow-2xl"
              initial={{ opacity: 0, scale: 0.8, x: 10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: 10 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              aria-label="New Task"
            >
              +
              <AnimatePresence>
                {buttonTooltip === "add" && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.18 }}
                    className="pointer-events-none absolute -top-14 left-1/2 z-50 w-max -translate-x-1/2 rounded-2xl border border-white/60 bg-white/80 py-2 px-3 text-center text-[11px] text-slate-900 shadow-lg backdrop-blur-xl"
                  >
                    <div className="font-semibold">New Task</div>
                    <div className="text-[10px] text-slate-500">Ctrl + T</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          )}
        </AnimatePresence>

        <div className="relative">
          <motion.button
            ref={buttonRef}
            type="button"
            onClick={() => setQuickOpen((prev) => !prev)}
            onMouseEnter={() => setButtonTooltip("list")}
            onMouseLeave={() => setButtonTooltip(null)}
            onFocus={() => {
              setIsFloatingButtonActive(true);
              setButtonTooltip("list");
            }}
            onBlur={() => {
              window.setTimeout(() => {
                if (
                  document.activeElement !== buttonRef.current &&
                  document.activeElement !== plusButtonRef.current
                ) {
                  setIsFloatingButtonActive(false);
                  setButtonTooltip(null);
                }
              }, 0);
            }}
            className="flex h-[52px] w-[52px] items-center justify-center rounded-full border border-slate-200 bg-white/95 shadow-xl backdrop-blur-xl text-xl text-slate-900 transition-transform duration-200 hover:scale-105 hover:shadow-2xl"
          >
            <span className="pointer-events-none">📋</span>
            {pendingTasks.length > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                {pendingTasks.length}
              </span>
            )}
          </motion.button>

          <AnimatePresence>
            {buttonTooltip === "list" && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.18 }}
                className="pointer-events-none absolute -top-14 left-1/2 z-50 w-max -translate-x-1/2 rounded-2xl border border-white/60 bg-white/80 py-2 px-3 text-center text-sm text-slate-900 shadow-lg backdrop-blur-xl"
              >
                Task List
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <AnimatePresence>
        {quickOpen && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute top-[80px] right-6 z-50 w-72 max-h-[340px] overflow-hidden rounded-3xl border border-slate-200 bg-white/95 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
              <div>
                <p className="text-sm font-semibold text-slate-900">📋 Tasks</p>
                <p className="text-[11px] text-slate-500">{allTasks.length} total</p>
              </div>
              <button
                type="button"
                onClick={() => setQuickOpen(false)}
                className="text-slate-400 transition hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <div className="p-3">
              <input
                type="text"
                placeholder="🔍 Search task..."
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#4F7CFF] focus:ring-2 focus:ring-[#4F7CFF]/20"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {['All', 'High', 'Medium', 'Low'].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setQuickFilter(option)}
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${quickFilter === option ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
            <div className="max-h-[190px] overflow-y-auto px-3 pb-3">
              {allTasks.length === 0 ? (
                <p className="rounded-3xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">No tasks available.</p>
              ) : filteredQuickTasks.length === 0 ? (
                <p className="rounded-3xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">No matching tasks.</p>
              ) : (
                <div className="space-y-3">
                  {filteredQuickTasks.map((task) => {
                    const colorClass = task.priority === 'High'
                      ? 'border-red-500 bg-red-50'
                      : task.priority === 'Medium'
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-emerald-500 bg-emerald-50';
                    const isFocusedCard = task.id === focusedTaskId;

                    return (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() => {
                          setQuickOpen(false);
                          setFocusedTaskId(task.id);
                          onFocusTask?.(task.id);
                        }}
                        className={`w-full overflow-hidden rounded-3xl border-l-4 p-3 text-left transition duration-200 hover:scale-105 hover:shadow-lg ${colorClass} ${task.completed ? 'opacity-50' : ''} ${isFocusedCard ? 'ring-2 ring-[#4F7CFF]/50' : ''}`}
                      >
                        <p className="text-sm font-semibold text-slate-900">
                          {task.completed ? '✓ ' : ''}{task.title}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-600">
                          {task.dueDate ? `${formatDate(task.dueDate)} • ${formatTime(task.time)}` : 'No due date'}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Focus Mode Exit overlay button */ }
  {
    focusMode && (
      <button
        onClick={() => setFocusMode(false)}
        className="absolute top-6 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-full bg-white/70 backdrop-blur-md border border-[#4F7CFF]/30 hover:border-[#4F7CFF] text-[#4F7CFF] hover:bg-[#EEF4FF] font-bold text-xs shadow-md transition-all duration-200 cursor-pointer flex items-center gap-1.5 z-40 hover:scale-105 active:scale-95"
      >
        <span>🎯</span>
        <span>Exit Focus Mode</span>
      </button>
    )
  }
  {
    isAllTasksEmpty ? (
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div
          className={
            `
                w-full
                max-w-130
                rounded-3xl
                backdrop-blur-xl
                p-10
                text-center
                shadow-2xl
                ${theme === "dark"
              ? "bg-slate-900/90 border border-slate-800 text-slate-100"
              : "bg-white/80 border border-white/50 text-slate-900"
            }
              `
          }
        >
          <div className="mx-auto w-28 h-28 rounded-full bg-linear-to-br from-[#4F7CFF] to-[#A855F7] shadow-lg flex items-center justify-center text-5xl mb-6">
            🫧
          </div>

          <h1 className={`text-3xl font-bold ${theme === "dark" ? "text-slate-100" : "text-[#0F172A]"}`}>
            {emptyStateTitle}
          </h1>

          <p className={`mt-3 text-base ${theme === "dark" ? "text-slate-300" : "text-gray-500"}`}>
            {emptyStateSubtitle}
          </p>

          <div className="grid grid-cols-3 gap-4 mt-8">
            <div className={`rounded-2xl p-4 hover:scale-105 transition ${theme === "dark" ? "bg-slate-800 text-slate-100" : "bg-[#F4F8FF]"}`}>
              <div className="text-2xl">➕</div>
              <p className="mt-2 text-sm font-semibold">Create Task</p>
            </div>
            <div className={`rounded-2xl p-4 hover:scale-105 transition ${theme === "dark" ? "bg-slate-800 text-slate-100" : "bg-[#F5ECFF]"}`}>
              <div className="text-2xl">🎯</div>
              <p className="mt-2 text-sm font-semibold">Focus Mode</p>
            </div>
            <div className={`rounded-2xl p-4 hover:scale-105 transition ${theme === "dark" ? "bg-slate-800 text-slate-100" : "bg-[#ECFDF5]"}`}>
              <div className="text-2xl">📅</div>
              <p className="mt-2 text-sm font-semibold">Plan Day</p>
            </div>
          </div>

          <button
            onClick={onAddTask}
            className="mt-8 px-8 py-3 rounded-full bg-[#4F7CFF] text-white font-semibold shadow-lg hover:scale-105 transition cursor-pointer"
          >
            Create Your First Task
          </button>
        </div>
      </div>
    ) : hasNoFilteredTasks ? (
      <div className="absolute inset-0 flex items-center justify-center z-10 px-6">
        <div
          className={
            `
                w-full
                max-w-lg
                rounded-3xl
                p-10
                text-center
                shadow-2xl
                ${theme === "dark"
              ? "bg-slate-900/90 border border-slate-800 text-slate-100"
              : "bg-white/90 border border-slate-200 text-slate-900"
            }
              `
          }
        >
          <div className="mx-auto w-24 h-24 rounded-full bg-slate-100/80 dark:bg-slate-800 flex items-center justify-center text-5xl mb-5">
            🧭
          </div>

          <h2 className={`text-2xl font-bold ${theme === "dark" ? "text-slate-100" : "text-slate-900"}`}>
            {emptyStateTitle}
          </h2>
          <p className={`mt-3 text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
            {emptyStateSubtitle}
          </p>
          <button
            onClick={onAddTask}
            className="mt-6 inline-flex items-center justify-center rounded-full bg-[#4F7CFF] px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-[#3565d6] transition cursor-pointer"
          >
            Create a task
          </button>
        </div>
      </div>
    ) : null
  }
  {
    tasks.map((task, index) => (
      <div
        key={task.id}
        className="absolute transition-transform duration-300 hover:scale-105"
        style={positions[index % positions.length]}
      >
        <Bubble
          key={task.id}
          task={task}
          onEdit={onEdit}
          onDelete={onDelete}
          onComplete={onComplete}
          onToggleFocus={onToggleFocus}
          onToggleSubtask={onToggleSubtask}
          isTooltipOpen={activeTooltipTaskId === task.id}
          onToggleTooltip={() => setActiveTooltipTaskId((prev) => (prev === task.id ? null : task.id))}
          isFocusedTask={task.id === focusedTaskId}
        />
      </div>
    ))
  }
    </div >
  );
}

export default PreviewPanel;