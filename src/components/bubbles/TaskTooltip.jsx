import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

// Helper for formatting creation date/time
function formatCreation(createdAtStr) {
  if (!createdAtStr) return "—";
  const d = new Date(createdAtStr);
  if (isNaN(d.getTime())) return createdAtStr;
  const dateLabel = d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
  const timeLabel = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${dateLabel} • ${timeLabel}`;
}

// Helper for formatting deadline date/time
function formatLongDateAndTime(dateStr, timeStr) {
  if (!dateStr) return "No deadline";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const formattedDate = d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
  if (!timeStr) return formattedDate;
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const formattedTime = `${hour % 12 || 12}:${m} ${ampm}`;
  return `${formattedDate} • ${formattedTime}`;
}

// Circular progress indicator component
const CircularIndicator = ({ percentage }) => {
  const r = 16;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percentage / 100) * circ;
  return (
    <div className="relative w-11 h-11 flex items-center justify-center shrink-0">
      <svg className="w-full h-full -rotate-90">
        <circle cx="22" cy="22" r={r} stroke="rgba(148,163,184,0.15)" strokeWidth="3.5" fill="none" />
        <circle cx="22" cy="22" r={r} stroke="#4F7CFF" strokeWidth="3.5" fill="none"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-500" />
      </svg>
      <span className="absolute text-[9px] font-black text-slate-800 dark:text-slate-100">{percentage}%</span>
    </div>
  );
};

export default function TaskTooltip({
  task,
  isOpen,
  isEditing,
  setIsEditing,
  onClose,
  onUpdateTask,
  position = "left",
  bubbleSize,
  bubbleContainerRef,
}) {
  const subtasks = task.subtasks || [];
  const doneCount = subtasks.filter((s) => s.done).length;
  const totalSubs = subtasks.length;
  const progress = totalSubs > 0 ? Math.round((doneCount / totalSubs) * 100) : (task.completed ? 100 : 0);

  // Form states
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDesc, setEditDesc] = useState(task.description || "");
  const [editPriority, setEditPriority] = useState(task.priority);
  const [editDueDate, setEditDueDate] = useState(task.dueDate || "");
  const [editTime, setEditTime] = useState(task.time || "");
  const [editReminderDate, setEditReminderDate] = useState(task.reminderDate || "");
  const [editReminderTime, setEditReminderTime] = useState(task.reminderTime || "");
  const [newSubText, setNewSubText] = useState("");

  const inputRef = useRef(null);

  // Sync state on task prop updates
  useEffect(() => {
    setEditTitle(task.title);
    setEditDesc(task.description || "");
    setEditPriority(task.priority);
    setEditDueDate(task.dueDate || "");
    setEditTime(task.time || "");
    setEditReminderDate(task.reminderDate || "");
    setEditReminderTime(task.reminderTime || "");
  }, [task]);

  // Click outside and Escape key handler
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e) => {
      if (bubbleContainerRef.current && !bubbleContainerRef.current.contains(e.target)) {
        onClose();
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, bubbleContainerRef]);

  if (!isOpen) return null;

  const handleSaveEdit = () => {
    onUpdateTask(task.id, {
      title: editTitle.trim(),
      description: editDesc.trim(),
      priority: editPriority,
      dueDate: editDueDate,
      time: editTime,
      reminderDate: editReminderDate,
      reminderTime: editReminderTime,
      hasReminder: !!(editReminderDate && editReminderTime),
    });
    setIsEditing(false);
  };

  const handleAddSubtask = () => {
    const text = newSubText.trim();
    if (!text) return;
    const newSub = { id: Date.now() + Math.random(), text, done: false };
    onUpdateTask(task.id, { subtasks: [...subtasks, newSub] });
    setNewSubText("");
    // Keep focus on input for fast adding
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleToggleSubtask = (subId) => {
    const updated = subtasks.map((s) => (s.id === subId ? { ...s, done: !s.done } : s));
    onUpdateTask(task.id, { subtasks: updated });
  };

  const handleDeleteSubtask = (subId) => {
    const updated = subtasks.filter((s) => s.id !== subId);
    onUpdateTask(task.id, { subtasks: updated });
  };

  // Get positioning styles based on dynamic space checking
  const getTooltipStyle = () => {
    const gap = 16;
    switch (position) {
      case "left":
        return { right: bubbleSize + gap, top: "50%", y: "-50%", x: 0 };
      case "top":
        return { bottom: bubbleSize + gap, left: "50%", x: "-50%", y: 0 };
      case "bottom":
        return { top: bubbleSize + gap, left: "50%", x: "-50%", y: 0 };
      default: // right
        return { left: bubbleSize + gap, top: "50%", y: "-50%", x: 0 };
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="absolute z-50 pointer-events-auto w-[320px] max-h-[380px] overflow-y-auto rounded-[20px] border shadow-2xl p-4 flex flex-col gap-3.5 cursor-default text-xs"
      style={{
        ...getTooltipStyle(),
        background: "rgba(255, 255, 255, 0.88)",
        backdropFilter: "blur(24px)",
        border: "1px solid rgba(255, 255, 255, 0.5)",
        boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
        scrollbarWidth: "none",
      }}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {isEditing ? (
        // --- Edit Mode ---
        <div className="flex flex-col gap-2.5 text-slate-800">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-sm">Edit Task</span>
            <button
              onClick={() => setIsEditing(false)}
              className="text-slate-400 hover:text-slate-600 hover:scale-110 transition-all font-bold text-sm cursor-pointer w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-100"
            >
              ✕
            </button>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Title</label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="p-2 rounded-xl bg-slate-100/80 border border-slate-200/60 text-slate-800 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Description</label>
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              className="p-2 rounded-xl bg-slate-100/80 border border-slate-200/60 text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 h-14 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Priority</label>
              <select
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value)}
                className="p-2 rounded-xl bg-slate-100/80 border border-slate-200/60 text-slate-800 text-xs font-semibold focus:outline-none"
              >
                <option value="Low">🌱 Low</option>
                <option value="Medium">⚡ Medium</option>
                <option value="High">🔥 High</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Due Date</label>
              <input
                type="date"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
                className="p-2 rounded-xl bg-slate-100/80 border border-slate-200/60 text-slate-800 text-[11px] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Due Time</label>
              <input
                type="time"
                value={editTime}
                onChange={(e) => setEditTime(e.target.value)}
                className="p-2 rounded-xl bg-slate-100/80 border border-slate-200/60 text-slate-800 text-xs focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Reminder Time</label>
              <input
                type="time"
                value={editReminderTime}
                onChange={(e) => setEditReminderTime(e.target.value)}
                className="p-2 rounded-xl bg-slate-100/80 border border-slate-200/60 text-slate-800 text-xs focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Reminder Date</label>
            <input
              type="date"
              value={editReminderDate}
              onChange={(e) => setEditReminderDate(e.target.value)}
              className="p-2 rounded-xl bg-slate-100/80 border border-slate-200/60 text-slate-800 text-[11px] focus:outline-none"
            />
          </div>

          <div className="flex gap-2 mt-1 shrink-0">
            <button
              onClick={() => setIsEditing(false)}
              className="flex-1 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              className="flex-1 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold transition cursor-pointer"
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        // --- Read-Only View ---
        <div className="flex flex-col gap-3.5 text-slate-800">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
            <div className="min-w-0">
              <h3 className="font-extrabold text-sm truncate text-slate-800">{task.title}</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Status:{" "}
                <span className={`font-bold ${task.completed ? "text-emerald-500" : "text-amber-500"}`}>
                  {task.completed ? "Completed" : "Pending"}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  task.priority === "High"
                    ? "bg-red-50 border-red-200 text-red-700"
                    : task.priority === "Low"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                      : "bg-orange-50 border-orange-200 text-orange-700"
                }`}
              >
                {task.priority || "Medium"}
              </span>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 hover:scale-110 transition-all font-bold text-sm cursor-pointer w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-100"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Body & Progress */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Description</p>
              <p className="text-slate-600 leading-relaxed truncate max-w-[200px]" title={task.description}>
                {task.description || "No description provided."}
              </p>
            </div>
            <CircularIndicator percentage={progress} />
          </div>

          {/* Subtasks Section */}
          <div className="flex flex-col gap-2 border-t border-b border-slate-100 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Subtasks ({doneCount}/{totalSubs})
            </p>
            <div
              className="max-h-28 overflow-y-auto space-y-1.5 pr-1 flex flex-col"
              style={{ scrollbarWidth: "none" }}
            >
              {subtasks.map((st) => (
                <div
                  key={st.id}
                  className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-slate-50 border border-slate-100"
                >
                  <label className="flex items-center gap-2 cursor-pointer min-w-0 flex-grow select-none">
                    <input
                      type="checkbox"
                      checked={st.done}
                      onChange={() => handleToggleSubtask(st.id)}
                      className="w-3.5 h-3.5 rounded text-indigo-500 accent-indigo-500"
                    />
                    <span
                      className={`text-[11px] truncate leading-tight ${
                        st.done ? "line-through text-slate-400" : "text-slate-700"
                      }`}
                    >
                      {st.text}
                    </span>
                  </label>
                  <button
                    onClick={() => handleDeleteSubtask(st.id)}
                    className="text-[10px] font-bold text-slate-400 hover:text-red-500 cursor-pointer px-1"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {totalSubs === 0 && (
                <p className="text-[10px] italic text-slate-400 text-center py-2">No subtasks added yet.</p>
              )}
            </div>

            {/* Quick Add Subtask */}
            <div className="flex gap-1.5 mt-1 shrink-0">
              <input
                ref={inputRef}
                type="text"
                placeholder="Add step..."
                value={newSubText}
                onChange={(e) => setNewSubText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddSubtask()}
                className="flex-1 px-2.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200/50 text-[11px] placeholder-slate-400 focus:outline-none"
              />
              <button
                onClick={handleAddSubtask}
                className="px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-[11px] transition cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>

          {/* Footer Timestamps */}
          <div className="flex flex-col gap-1 text-[9px] text-slate-400 font-semibold uppercase tracking-wider">
            <div className="flex justify-between">
              <span>Created:</span>
              <span className="text-slate-500 font-bold">{formatCreation(task.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span>Deadline:</span>
              <span className="text-slate-500 font-bold">{formatLongDateAndTime(task.dueDate, task.time)}</span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
