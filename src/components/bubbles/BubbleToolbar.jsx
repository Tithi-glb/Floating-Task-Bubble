import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Tooltip from "../Tooltip";

const ACTIONS = [
  { key: "edit", icon: "✏️", label: "Edit Task" },
  { key: "complete", icon: "✓", label: "Mark Complete" },
  { key: "reminder", icon: "🔔", label: "Set Reminder" },
  { key: "priority", icon: "🔥", label: "Change Priority" },
  { key: "progress", icon: "📊", label: "View Progress" },
  { key: "pin", icon: "📌", label: "Pin Task" },
  { key: "delete", icon: "🗑️", label: "Delete Task" },
];

const PRIORITIES = [
  { label: "🔥 High", value: "High" },
  { label: "⚡ Medium", value: "Medium" },
  { label: "🌱 Low", value: "Low" },
];

export default function BubbleToolbar({
  task,
  onEdit,
  onDelete,
  onComplete,
  onToggleFocus,
  onUpdateTask,
  onOpenProgress, // Triggers progress view
  visible,
  position = "right",
  bubbleSize,
}) {
  const [subMenu, setSubMenu] = useState(null); // "priority" | "reminder"
  const [reminderDate, setReminderDate] = useState(task.reminderDate || "");
  const [reminderTime, setReminderTime] = useState(task.reminderTime || "");

  useEffect(() => {
    setReminderDate(task.reminderDate || "");
    setReminderTime(task.reminderTime || "");
  }, [task]);

  const handleAction = (key, e) => {
    e.stopPropagation();
    switch (key) {
      case "edit":
        onEdit(task);
        break;
      case "complete":
        onComplete(task.id);
        break;
      case "delete":
        onDelete(task.id);
        break;
      case "pin":
        onToggleFocus(task.id);
        break;
      case "progress":
        onOpenProgress(task.id); // Opens Progress Tracker
        break;
      case "priority":
      case "reminder":
        setSubMenu((prev) => (prev === key ? null : key));
        break;
      default:
        break;
    }
  };

  const handleSaveReminder = (e) => {
    e.stopPropagation();
    onUpdateTask(task.id, {
      reminderDate,
      reminderTime,
      hasReminder: !!(reminderDate && reminderTime),
    });
    setSubMenu(null);
  };

  const handleRemoveReminder = (e) => {
    e.stopPropagation();
    onUpdateTask(task.id, {
      reminderDate: "",
      reminderTime: "",
      hasReminder: false,
    });
    setReminderDate("");
    setReminderTime("");
    setSubMenu(null);
  };

  const handleReminderKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveReminder(e);
    }
  };

  // Get positioning styles based on dynamic toolbar positioning
  const getStyle = () => {
    const gap = 12;
    switch (position) {
      case "left":
        return { right: bubbleSize + gap, top: "50%", y: "-50%", x: 0 };
      case "above":
        return { bottom: bubbleSize + gap, left: "50%", x: "-50%", y: 0 };
      default: // right
        return { left: bubbleSize + gap, top: "50%", y: "-50%", x: 0 };
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="absolute z-50 pointer-events-auto"
          style={getStyle()}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Main Horizontal Toolbar pill */}
          <div
            className="flex flex-row items-center gap-[10px] p-[10px] px-[14px] rounded-[20px] border border-white/20 shadow-2xl h-[50px] shrink-0"
            style={{
              background: "rgba(15, 23, 42, 0.88)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
            }}
          >
            {ACTIONS.map((action) => (
              <Tooltip key={action.key} content={action.label}>
                <button
                  onClick={(e) => handleAction(action.key, e)}
                  className={`relative w-8 h-8 flex items-center justify-center rounded-xl text-sm transition-all duration-150 cursor-pointer select-none
                    ${subMenu === action.key
                      ? "bg-white/20 scale-110"
                      : action.key === "delete"
                        ? "hover:bg-red-500/30 text-red-200"
                        : action.key === "complete"
                          ? "hover:bg-emerald-500/30 text-emerald-200"
                          : "hover:bg-white/10 text-white"
                    }`}
                >
                  <span className="text-base leading-none">{action.icon}</span>
                </button>
              </Tooltip>
            ))}
          </div>

          {/* Submenus floating above or below toolbar */}
          <AnimatePresence>
            {subMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 8 }}
                transition={{ duration: 0.12 }}
                className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 rounded-2xl border border-white/15 shadow-2xl p-3 min-w-44 z-50 text-xs"
                style={{
                  background: "rgba(15, 23, 42, 0.95)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                }}
              >
                {subMenu === "priority" && (
                  <div className="flex flex-col gap-1 text-white">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-white/40 mb-1.5">Priority</p>
                    {PRIORITIES.map((p) => (
                      <Tooltip key={p.value} content={`Set ${p.value} priority`} className="w-full">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateTask(task.id, { priority: p.value });
                            setSubMenu(null);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer
                            ${task.priority === p.value ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/5 hover:text-white"}`}
                        >
                          {p.label}
                        </button>
                      </Tooltip>
                    ))}
                  </div>
                )}

                {subMenu === "reminder" && (
                  <div className="flex flex-col gap-2 text-xs text-white">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-white/40">Reminder</p>
                    <Tooltip content="Set reminder date" className="w-full">
                      <input
                        type="date"
                        value={reminderDate}
                        min={new Date().toISOString().split("T")[0]}
                        onChange={(e) => setReminderDate(e.target.value)}
                        onKeyDown={handleReminderKeyDown}
                        className="w-full px-2 py-1.5 rounded-lg bg-white/10 border border-white/10 text-white text-xs focus:outline-none"
                      />
                    </Tooltip>
                    <Tooltip content="Set reminder time" className="w-full">
                      <input
                        type="time"
                        value={reminderTime}
                        onChange={(e) => setReminderTime(e.target.value)}
                        onKeyDown={handleReminderKeyDown}
                        className="w-full px-2 py-1.5 rounded-lg bg-white/10 border border-white/10 text-white text-xs focus:outline-none"
                      />
                    </Tooltip>
                    <div className="flex gap-1.5 mt-1">
                      <Tooltip content="Save reminder settings" className="flex-1">
                        <button
                          onClick={handleSaveReminder}
                          className="w-full py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold transition cursor-pointer"
                        >
                          Save
                        </button>
                      </Tooltip>
                      {(task.reminderDate || task.reminderTime) && (
                        <Tooltip content="Clear reminder settings">
                          <button
                            onClick={handleRemoveReminder}
                            className="px-2 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500 text-red-200 hover:text-white text-xs font-bold transition cursor-pointer"
                          >
                            ✕
                          </button>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
