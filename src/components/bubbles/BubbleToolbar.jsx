import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ACTIONS = [
  { key: "edit",       icon: "✏️",  label: "Edit Task" },
  { key: "complete",   icon: "✅",  label: "Mark Complete" },
  { key: "deadline",   icon: "⏰",  label: "Change Deadline" },
  { key: "priority",   icon: "🔥",  label: "Change Priority" },
  { key: "subtask",    icon: "➕",  label: "Add Subtask" },
  { key: "details",    icon: "📋",  label: "View Details" },
  { key: "progress",   icon: "📊",  label: "Open Progress" },
  { key: "reminder",   icon: "🔔",  label: "Add Reminder" },
  { key: "pin",        icon: "📌",  label: "Pin Bubble" },
  { key: "color",      icon: "🎨",  label: "Change Color" },
  { key: "delete",     icon: "🗑️",  label: "Delete Task" },
];

const COLORS = [
  "#dc2626", "#ea580c", "#ca8a04", "#16a34a",
  "#0891b2", "#4f46e5", "#9333ea", "#db2777",
  "#64748b", "#1e293b",
];

const PRIORITIES = [
  { label: "🔥 High",   value: "High" },
  { label: "⚡ Medium", value: "Medium" },
  { label: "🌱 Low",    value: "Low" },
];

/**
 * BubbleToolbar — Floating action menu that appears on bubble hover.
 * Props:
 *  task         — the task object
 *  onEdit       — fn(task)
 *  onDelete     — fn(taskId)
 *  onComplete   — fn(taskId)
 *  onToggleFocus — fn(taskId)
 *  onUpdateTask — fn(partial task update)
 *  onOpenProgress — fn()
 *  visible      — boolean (controlled by parent hover state)
 */
export default function BubbleToolbar({
  task,
  onEdit,
  onDelete,
  onComplete,
  onToggleFocus,
  onUpdateTask,
  onOpenProgress,
  visible,
}) {
  const [subMenu, setSubMenu] = useState(null); // "priority" | "color" | "deadline" | "reminder" | "subtask"
  const [newSubtaskText, setNewSubtaskText] = useState("");
  const [reminderDate, setReminderDate] = useState("");
  const [reminderTime, setReminderTime] = useState("");

  const handleAction = (key) => {
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
      case "details":
        onEdit(task);
        break;
      case "progress":
        onOpenProgress && onOpenProgress();
        break;
      case "priority":
      case "color":
      case "deadline":
      case "reminder":
      case "subtask":
        setSubMenu((prev) => (prev === key ? null : key));
        break;
      default:
        break;
    }
  };

  const handleAddSubtask = () => {
    if (!newSubtaskText.trim()) return;
    const newSub = { id: Date.now() + Math.random(), text: newSubtaskText.trim(), done: false };
    onUpdateTask({ subtasks: [...(task.subtasks || []), newSub] });
    setNewSubtaskText("");
    setSubMenu(null);
  };

  const handleSetReminder = () => {
    if (!reminderDate || !reminderTime) return;
    const deadline = new Date(`${reminderDate}T${reminderTime}:00`);
    if (isNaN(deadline)) return;
    // Store reminder as a notification timestamp — Dashboard picks it up
    const reminders = JSON.parse(localStorage.getItem("ftb_reminders") || "[]");
    reminders.push({ taskId: task.id, taskTitle: task.title, reminderAt: deadline.toISOString() });
    localStorage.setItem("ftb_reminders", JSON.stringify(reminders));
    setSubMenu(null);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.92 }}
          transition={{ type: "spring", stiffness: 320, damping: 24 }}
          className="absolute z-50 pointer-events-auto"
          style={{ bottom: "calc(100% + 10px)", left: "50%", transform: "translateX(-50%)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Main toolbar strip */}
          <div
            className="flex items-center gap-1 px-2 py-1.5 rounded-2xl border border-white/20 shadow-2xl"
            style={{
              background: "rgba(15, 23, 42, 0.85)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
            }}
          >
            {ACTIONS.map((action, i) => (
              <motion.button
                key={action.key}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.025, type: "spring", stiffness: 400, damping: 20 }}
                onClick={() => handleAction(action.key)}
                title={action.label}
                className={`relative w-7 h-7 flex items-center justify-center rounded-xl text-sm transition-all duration-150 cursor-pointer select-none
                  ${subMenu === action.key
                    ? "bg-white/20 scale-110"
                    : action.key === "delete"
                      ? "hover:bg-red-500/30"
                      : action.key === "complete"
                        ? "hover:bg-emerald-500/30"
                        : "hover:bg-white/15"
                  }`}
              >
                <span className="text-base leading-none">{action.icon}</span>
              </motion.button>
            ))}
          </div>

          {/* Sub-menu panels */}
          <AnimatePresence>
            {subMenu && (
              <motion.div
                key={subMenu}
                initial={{ opacity: 0, y: -6, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 360, damping: 26 }}
                className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 rounded-2xl border border-white/15 shadow-2xl p-3 min-w-48"
                style={{
                  background: "rgba(15, 23, 42, 0.92)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                }}
              >
                {/* Priority sub-menu */}
                {subMenu === "priority" && (
                  <div className="flex flex-col gap-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Change Priority</p>
                    {PRIORITIES.map((p) => (
                      <button
                        key={p.value}
                        onClick={() => { onUpdateTask({ priority: p.value }); setSubMenu(null); }}
                        className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer
                          ${task.priority === p.value ? "bg-white/20 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"}`}
                      >
                        {p.label}
                        {task.priority === p.value && <span className="float-right">✓</span>}
                      </button>
                    ))}
                  </div>
                )}

                {/* Color sub-menu */}
                {subMenu === "color" && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Bubble Color</p>
                    <div className="grid grid-cols-5 gap-2">
                      {COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={() => { onUpdateTask({ color: c }); setSubMenu(null); }}
                          className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 cursor-pointer"
                          style={{
                            backgroundColor: c,
                            borderColor: task.color === c ? "white" : "transparent",
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Deadline sub-menu */}
                {subMenu === "deadline" && (
                  <div className="flex flex-col gap-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Change Deadline</p>
                    <input
                      type="date"
                      defaultValue={task.dueDate}
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full px-2 py-1.5 rounded-lg bg-white/10 border border-white/10 text-white text-xs focus:outline-none focus:border-white/30"
                      onChange={(e) => onUpdateTask({ dueDate: e.target.value })}
                    />
                    <input
                      type="time"
                      defaultValue={task.time}
                      className="w-full px-2 py-1.5 rounded-lg bg-white/10 border border-white/10 text-white text-xs focus:outline-none focus:border-white/30"
                      onChange={(e) => onUpdateTask({ time: e.target.value })}
                    />
                    <button
                      onClick={() => setSubMenu(null)}
                      className="mt-1 py-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-semibold cursor-pointer transition"
                    >
                      Save
                    </button>
                  </div>
                )}

                {/* Reminder sub-menu */}
                {subMenu === "reminder" && (
                  <div className="flex flex-col gap-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Set Reminder</p>
                    <input
                      type="date"
                      value={reminderDate}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setReminderDate(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg bg-white/10 border border-white/10 text-white text-xs focus:outline-none"
                    />
                    <input
                      type="time"
                      value={reminderTime}
                      onChange={(e) => setReminderTime(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg bg-white/10 border border-white/10 text-white text-xs focus:outline-none"
                    />
                    <button
                      onClick={handleSetReminder}
                      className="mt-1 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-xs font-semibold cursor-pointer transition"
                    >
                      Set Reminder
                    </button>
                  </div>
                )}

                {/* Add Subtask sub-menu */}
                {subMenu === "subtask" && (
                  <div className="flex flex-col gap-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Add Subtask</p>
                    <input
                      type="text"
                      placeholder="Subtask description..."
                      value={newSubtaskText}
                      onChange={(e) => setNewSubtaskText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddSubtask()}
                      className="w-full px-2 py-1.5 rounded-lg bg-white/10 border border-white/10 text-white text-xs placeholder-white/30 focus:outline-none focus:border-white/30"
                      autoFocus
                    />
                    <button
                      onClick={handleAddSubtask}
                      className="py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-semibold cursor-pointer transition"
                    >
                      Add Step
                    </button>
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
