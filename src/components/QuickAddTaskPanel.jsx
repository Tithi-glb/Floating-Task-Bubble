import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Tooltip from "./Tooltip";

export default function QuickAddTaskPanel({ theme, onCreateTask, defaultPriority = "Medium", onClose }) {
  const isDark = theme === "dark";
  const today = new Date().toISOString().split("T")[0];

  const getDueTimeDefault = () => {
    const d = new Date();
    d.setHours(d.getHours() + 1);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  const getReminderTimeFromDueTime = (dueTimeStr) => {
    if (!dueTimeStr) return "";
    const [hours, minutes] = dueTimeStr.split(":").map(Number);
    const d = new Date();
    d.setHours(hours, minutes - 15, 0, 0);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  const defaultDueTime = getDueTimeDefault();
  const defaultReminderTime = getReminderTimeFromDueTime(defaultDueTime);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [time, setTime] = useState(defaultDueTime);
  const [dueDate, setDueDate] = useState(today);
  const [reminderDate, setReminderDate] = useState(today);
  const [reminderTime, setReminderTime] = useState(defaultReminderTime);
  const [subtasks, setSubtasks] = useState([]);

  const [isReminderTimeUserEdited, setIsReminderTimeUserEdited] = useState(false);
  const [isReminderDateUserEdited, setIsReminderDateUserEdited] = useState(false);

  // Subtask input states
  const [showAddSubtaskInput, setShowAddSubtaskInput] = useState(false);
  const [newSubtaskText, setNewSubtaskText] = useState("");

  // More details expansion state
  const [showDetails, setShowDetails] = useState(false);

  const titleInputRef = useRef(null);
  const subtaskInputRef = useRef(null);

  // Auto-focus title input on mount
  useEffect(() => {
    if (titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, []);

  // Auto-focus subtask input when toggled open
  useEffect(() => {
    if (showAddSubtaskInput && subtaskInputRef.current) {
      subtaskInputRef.current.focus();
    }
  }, [showAddSubtaskInput]);

  const handleDueTimeChange = (newDueTime) => {
    setTime(newDueTime);
    if (!isReminderTimeUserEdited) {
      setReminderTime(getReminderTimeFromDueTime(newDueTime));
    }
  };

  const handleDueDateChange = (newDueDate) => {
    setDueDate(newDueDate);
    if (!isReminderDateUserEdited) {
      setReminderDate(newDueDate);
    }
  };

  const handleReminderTimeChange = (newReminderTime) => {
    setReminderTime(newReminderTime);
    setIsReminderTimeUserEdited(true);
  };

  const handleReminderDateChange = (newReminderDate) => {
    setReminderDate(newReminderDate);
    setIsReminderDateUserEdited(true);
  };

  const handleAddSubtask = () => {
    if (!newSubtaskText.trim()) return;
    setSubtasks((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), text: newSubtaskText.trim(), done: false },
    ]);
    setNewSubtaskText("");
    setShowAddSubtaskInput(false);
  };

  const handleDeleteSubtask = (id) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!title.trim()) return;

    // Apply defaults logic if values are empty
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 1 * 60 * 60 * 1000);
    const hasTime = !!time;
    const targetDate = dueDate || today;
    const targetTime = hasTime ? time : `${String(oneHourLater.getHours()).padStart(2, '0')}:${String(oneHourLater.getMinutes()).padStart(2, '0')}`;

    const [hours, minutes] = targetTime.split(":").map((value) => parseInt(value, 10));
    const normalizedDate = new Date(targetDate);
    normalizedDate.setHours(hours, minutes, 0, 0);

    if (!hasTime) {
      const nowDate = new Date(now);
      nowDate.setHours(now.getHours(), now.getMinutes(), 0, 0);
      const adjusted = new Date(nowDate.getTime() + 1 * 60 * 60 * 1000);
      normalizedDate.setFullYear(adjusted.getFullYear(), adjusted.getMonth(), adjusted.getDate());
      normalizedDate.setHours(adjusted.getHours(), adjusted.getMinutes(), 0, 0);
    }

    const finalDueDate = normalizedDate.toISOString().split('T')[0];
    const finalDueTime = `${String(normalizedDate.getHours()).padStart(2, '0')}:${String(normalizedDate.getMinutes()).padStart(2, '0')}`;

    let finalReminderDate = reminderDate;
    let finalReminderTime = reminderTime;

    if (!finalReminderDate) {
      finalReminderDate = finalDueDate;
    }
    if (!finalReminderTime) {
      finalReminderTime = getReminderTimeFromDueTime(finalDueTime);
    }

    onCreateTask({
      title: title.trim(),
      description: description.trim(),
      time: finalDueTime,
      dueDate: finalDueDate,
      reminderDate: finalReminderDate,
      reminderTime: finalReminderTime,
      hasReminder: !!(finalReminderDate && finalReminderTime),
      priority: defaultPriority,
      isFocused: false,
      completed: false,
      subtasks,
      color: "#60A5FA",
      createdAt: new Date().toISOString(),
    });

    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && e.target.tagName !== "TEXTAREA") {
      e.preventDefault();
      if (showAddSubtaskInput && e.target === subtaskInputRef.current) {
        handleAddSubtask();
      } else {
        handleSubmit(e);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  // Styles
  const labelColor = isDark ? "text-slate-400" : "text-slate-500";
  const inputBg = isDark ? "bg-slate-950/60 border-slate-800 text-white placeholder-slate-500" : "bg-white/90 border-slate-200 text-slate-800 placeholder-slate-400";
  const footerText = isDark ? "text-slate-500" : "text-slate-400";

  return (
    <div
      onKeyDown={handleKeyDown}
      className={`flex flex-col gap-4 w-full p-5 max-w-[480px] transition-all`}
    >
      {/* Title / Task Name Input */}
      <div className="flex flex-col gap-1.5">
        <label className={`text-xs font-bold uppercase tracking-wider ${labelColor}`}>Task Name</label>
        <Tooltip content="Enter task title" className="w-full">
          <input
            ref={titleInputRef}
            type="text"
            placeholder="Task name..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`w-full p-3 rounded-xl border focus:outline-none focus:border-[#4F7CFF] focus:ring-2 focus:ring-[#4F7CFF]/15 transition font-medium ${inputBg}`}
          />
        </Tooltip>
      </div>

      {/* Expandable Details Container */}
      <AnimatePresence initial={false}>
        {showDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden flex flex-col gap-4"
          >
            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <label className={`text-xs font-bold uppercase tracking-wider ${labelColor}`}>Description</label>
              <Tooltip content="Enter task description" className="w-full">
                <textarea
                  rows={3}
                  placeholder="Description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`w-full p-3 rounded-xl border focus:outline-none focus:border-[#4F7CFF] focus:ring-2 focus:ring-[#4F7CFF]/15 transition text-xs resize-none ${inputBg}`}
                />
              </Tooltip>
            </div>

            {/* Dates / Times Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className={`font-bold uppercase tracking-wider ${labelColor}`}>Due Date</label>
                <Tooltip content="Set due date" className="w-full">
                  <input
                    type="date"
                    min={today}
                    value={dueDate}
                    onChange={(e) => handleDueDateChange(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border focus:outline-none focus:border-[#4F7CFF] focus:ring-2 focus:ring-[#4F7CFF]/15 transition ${inputBg}`}
                  />
                </Tooltip>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={`font-bold uppercase tracking-wider ${labelColor}`}>Due Time</label>
                <Tooltip content="Set due time" className="w-full">
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => handleDueTimeChange(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border focus:outline-none focus:border-[#4F7CFF] focus:ring-2 focus:ring-[#4F7CFF]/15 transition ${inputBg}`}
                  />
                </Tooltip>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={`font-bold uppercase tracking-wider ${labelColor}`}>Reminder Date</label>
                <Tooltip content="Set reminder date" className="w-full">
                  <input
                    type="date"
                    min={today}
                    value={reminderDate}
                    onChange={(e) => handleReminderDateChange(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border focus:outline-none focus:border-[#4F7CFF] focus:ring-2 focus:ring-[#4F7CFF]/15 transition ${inputBg}`}
                  />
                </Tooltip>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={`font-bold uppercase tracking-wider ${labelColor}`}>Reminder Time</label>
                <Tooltip content="Set reminder time" className="w-full">
                  <input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => handleReminderTimeChange(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border focus:outline-none focus:border-[#4F7CFF] focus:ring-2 focus:ring-[#4F7CFF]/15 transition ${inputBg}`}
                  />
                </Tooltip>
              </div>
            </div>

            {/* Subtasks Section */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between border-b pb-1 border-slate-200/40">
                <label className={`text-xs font-bold uppercase tracking-wider ${labelColor}`}>Subtasks</label>
                {!showAddSubtaskInput ? (
                  <Tooltip content="Add step to checklist">
                    <button
                      type="button"
                      onClick={() => setShowAddSubtaskInput(true)}
                      className="text-xs font-bold text-[#4F7CFF] hover:text-[#3b66df] transition cursor-pointer"
                    >
                      + Add subtask
                    </button>
                  </Tooltip>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <Tooltip content="Save subtask">
                      <button
                        type="button"
                        onClick={handleAddSubtask}
                        className="text-xs font-bold text-emerald-500 hover:text-emerald-600 transition cursor-pointer"
                      >
                        ✓ Save
                      </button>
                    </Tooltip>
                    <Tooltip content="Cancel subtask">
                      <button
                        type="button"
                        onClick={() => setShowAddSubtaskInput(false)}
                        className="text-xs font-bold text-red-500 hover:text-red-600 transition cursor-pointer"
                      >
                        ✕
                      </button>
                    </Tooltip>
                  </div>
                )}
              </div>

              {showAddSubtaskInput && (
                <input
                  ref={subtaskInputRef}
                  type="text"
                  placeholder="Subtask name..."
                  value={newSubtaskText}
                  onChange={(e) => setNewSubtaskText(e.target.value)}
                  className={`w-full p-2 rounded-lg border text-xs focus:outline-none focus:border-[#4F7CFF] transition ${inputBg}`}
                />
              )}

              {/* Subtask list */}
              {subtasks.length > 0 && (
                <div className="flex flex-col gap-1.5 max-h-28 overflow-y-auto pr-1">
                  {subtasks.map((st) => (
                    <div
                      key={st.id}
                      className={`flex items-center justify-between p-2 rounded-lg border text-xs ${isDark ? "bg-slate-900/30 border-slate-800/60" : "bg-slate-50/50 border-slate-100"}`}
                    >
                      <span className={isDark ? "text-slate-300" : "text-slate-600"}>{st.text}</span>
                      <Tooltip content="Delete subtask">
                        <button
                          type="button"
                          onClick={() => handleDeleteSubtask(st.id)}
                          className="text-red-400 hover:text-red-500 cursor-pointer font-bold px-1"
                        >
                          🗑️
                        </button>
                      </Tooltip>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer / Toggle & Submit Actions */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-200/40">
        {/* Toggle Details */}
        <Tooltip content={showDetails ? "Show fewer details" : "Show more task details"}>
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-[#4F7CFF] transition cursor-pointer"
          >
            <span>{showDetails ? "Less details" : "More details"}</span>
            <span>{showDetails ? "▲" : "▼"}</span>
          </button>
        </Tooltip>

        {/* Create Task Button (visible only when details are expanded or title has value) */}
        {showDetails && (
          <Tooltip content="Submit and create task">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!title.trim()}
              className={`px-5 py-2 rounded-xl text-xs font-extrabold text-white transition-all shadow-md cursor-pointer ${
                title.trim()
                  ? "bg-gradient-to-r from-[#4F7CFF] to-[#7c3aed] hover:shadow-lg hover:shadow-[#4F7CFF]/20 hover:scale-[1.02]"
                  : "bg-slate-600 opacity-50 cursor-not-allowed"
              }`}
            >
              Create Task ✓
            </button>
          </Tooltip>
        )}
      </div>

      {/* Footer shortcut helper text */}
      <div className={`flex justify-between items-center text-[10px] font-semibold ${footerText}`}>
        <span>Press Enter to create</span>
        <span>Esc to close</span>
      </div>
    </div>
  );
}
