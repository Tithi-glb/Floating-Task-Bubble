import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import Tooltip from "../Tooltip";

export default function FloatingTaskListBubble({ tasks, onEdit, theme }) {
  const [isOpen, setIsOpen] = useState(false);
  const isDark = theme === "dark";
  const containerRef = useRef(null);
  const dragControls = useDragControls();

  const handlePointerDown = (e) => {
    dragControls.start(e);
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const incompleteTasks = tasks.filter((t) => !t.completed);
  const totalCount = incompleteTasks.length;

  const priorityColors = {
    High: "bg-red-500 text-red-50 dark:bg-red-500/20 dark:text-red-300",
    Medium: "bg-orange-500 text-orange-50 dark:bg-orange-500/20 dark:text-orange-300",
    Low: "bg-emerald-500 text-emerald-50 dark:bg-emerald-500/20 dark:text-emerald-300",
  };

  return (
    <motion.div
      ref={containerRef}
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      className="fixed top-20 right-6 z-[999] flex flex-col items-end"
    >
      {/* Floating Trigger Bubble */}
      <Tooltip content={isOpen ? "Close task list" : "Open task list"}>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onPointerDown={handlePointerDown}
          onClick={() => setIsOpen(!isOpen)}
          className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg border backdrop-blur-md cursor-pointer transition-all relative select-none touch-none ${isDark
              ? "bg-slate-900/90 border-slate-800 text-white hover:bg-slate-950"
              : "bg-white/90 border-slate-200 text-slate-800 hover:bg-slate-50"
            }`}
        >
          <span className="text-xl">📋</span>
          {totalCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#4F7CFF] text-white text-[10px] font-extrabold flex items-center justify-center shadow-md animate-pulse">
              {totalCount}
            </span>
          )}
        </motion.button>
      </Tooltip>

      {/* Expanded List Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`mt-3 w-80 max-h-[400px] rounded-3xl shadow-2xl border flex flex-col overflow-hidden backdrop-blur-xl ${isDark
                ? "bg-slate-900/95 border-slate-800 text-white"
                : "bg-white/95 border-slate-250 text-slate-800"
              }`}
          >
            {/* Header */}
            <div className={`p-4 font-extrabold text-sm border-b flex items-center justify-between shrink-0 w-full ${isDark ? "border-slate-800 text-slate-200" : "border-slate-100 text-slate-700"
              }`}>
              <div className="flex items-center gap-2">
                <span>Floating Task List</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${isDark ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"
                  }`}>
                  {totalCount} Active
                </span>
              </div>
              <Tooltip content="Close task list">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs cursor-pointer transition-all ${isDark
                      ? "bg-slate-855 text-slate-400 hover:bg-slate-700 hover:text-white"
                      : "bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500"
                    }`}
                >
                  ✕
                </button>
              </Tooltip>
            </div>

            {/* List */}
            <div className="flex-grow overflow-y-auto p-3 space-y-2">
              {incompleteTasks.length === 0 ? (
                <div className={`text-center py-8 text-xs font-semibold ${isDark ? "text-slate-500" : "text-slate-400"
                  }`}>
                  🎉 No active tasks!
                </div>
              ) : (
                incompleteTasks.map((task) => (
                  <Tooltip key={task.id} content="Click to view/edit details" className="w-full">
                    <div
                      onClick={() => {
                        onEdit(task);
                        setIsOpen(false); // Close list after opening task details
                      }}
                      className={`w-full p-3 rounded-2xl border transition-all cursor-pointer flex flex-col gap-1.5 group text-left ${isDark
                          ? "bg-slate-950/40 border-slate-850 hover:bg-slate-950 hover:border-slate-750"
                          : "bg-slate-50/50 border-slate-150 hover:bg-white hover:border-[#4F7CFF]/45"
                        }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold leading-snug group-hover:text-[#4F7CFF] transition truncate max-w-[170px]">
                          {task.title}
                        </span>
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase shrink-0 ${priorityColors[task.priority] || priorityColors.Medium
                          }`}>
                          {task.priority}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[10px]">
                        <span className={isDark ? "text-slate-505" : "text-slate-400"}>📅</span>
                        <span className={`font-semibold ${isDark ? "text-slate-400" : "text-slate-500"
                          }`}>
                          {task.dueDate || "No Date"} {task.time ? `@ ${task.time}` : ""}
                        </span>
                      </div>
                    </div>
                  </Tooltip>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
