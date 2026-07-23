import { useState, useEffect } from "react";
import Tooltip from "../Tooltip";

function AddTaskModal({ onClose, onCreate, editingTask, defaultPriority = "Medium" }) {
  const [title, setTitle] = useState(editingTask?.title || "");
  const [description, setDescription] = useState(editingTask?.description || "");
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

  const [time, setTime] = useState(editingTask?.time ? editingTask.time : getDueTimeDefault());
  const [dueDate, setDueDate] = useState(editingTask?.dueDate ? editingTask.dueDate : today);
  const [priority, setPriority] = useState(editingTask?.priority || defaultPriority);
  const [isFocused, setIsFocused] = useState(editingTask?.isFocused || false);
  const [subtasks, setSubtasks] = useState(editingTask?.subtasks || []);
  const [newSubtaskText, setNewSubtaskText] = useState("");

  const defaultReminderTimeVal = editingTask?.reminderTime ? editingTask.reminderTime : getReminderTimeFromDueTime(editingTask?.time ? editingTask.time : getDueTimeDefault());
  const defaultReminderDateVal = editingTask?.reminderDate ? editingTask.reminderDate : (editingTask?.dueDate ? editingTask.dueDate : today);

  const [reminderDate, setReminderDate] = useState(defaultReminderDateVal);
  const [reminderTime, setReminderTime] = useState(defaultReminderTimeVal);

  const [isReminderTimeUserEdited, setIsReminderTimeUserEdited] = useState(
    editingTask ? (editingTask.isReminderTimeUserEdited ?? Boolean(editingTask.reminderTime)) : false
  );
  const [isReminderDateUserEdited, setIsReminderDateUserEdited] = useState(
    editingTask ? (editingTask.isReminderDateUserEdited ?? Boolean(editingTask.reminderDate)) : false
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!(editingTask && (!editingTask.isDraft || editingTask.isEdit));

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

  useEffect(() => {
    const draftData = {
      isEdit: isEditMode,
      editingTaskId: editingTask?.isDraft ? (editingTask.editingTaskId || null) : (editingTask?.id || null),
      title,
      description,
      time,
      dueDate,
      priority,
      isFocused,
      subtasks,
      reminderDate,
      reminderTime,
      isReminderTimeUserEdited,
      isReminderDateUserEdited,
    };
    localStorage.setItem("ftb_task_draft", JSON.stringify(draftData));
  }, [
    title,
    description,
    time,
    dueDate,
    priority,
    isFocused,
    subtasks,
    reminderDate,
    reminderTime,
    isReminderTimeUserEdited,
    isReminderDateUserEdited,
    editingTask,
  ]);

  const handleDiscardDraft = () => {
    localStorage.removeItem("ftb_task_draft");
    setTitle("");
    setDescription("");
    const defTime = getDueTimeDefault();
    setTime(defTime);
    setDueDate(today);
    setPriority(defaultPriority);
    setIsFocused(false);
    setSubtasks([]);
    setReminderDate(today);
    setReminderTime(getReminderTimeFromDueTime(defTime));
    setIsReminderTimeUserEdited(false);
    setIsReminderDateUserEdited(false);
  };
  const TITLE_MAX = 50;
  const DESCRIPTION_MAX = 250;

  const handleAddSubtask = (e) => {
    e.preventDefault();
    if (!newSubtaskText.trim()) return;
    setSubtasks((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), text: newSubtaskText.trim(), done: false },
    ]);
    setNewSubtaskText("");
  };

  const handleToggleSubtask = (id) => {
    setSubtasks((prev) =>
      prev.map((s) => (s.id === id ? { ...s, done: !s.done } : s))
    );
  };

  const handleDeleteSubtask = (id) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== id));
  };

  const getSmartDateTime = () => {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 1 * 60 * 60 * 1000);

    const hasDate = Boolean(dueDate);
    const hasTime = Boolean(time);

    const targetDate = hasDate ? new Date(dueDate) : now;
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

    return {
      dueDate: normalizedDate.toISOString().split('T')[0],
      time: `${String(normalizedDate.getHours()).padStart(2, '0')}:${String(normalizedDate.getMinutes()).padStart(2, '0')}`,
    };
  };

  const handleSubmit = () => {
    if (isSubmitting) return;
    if (!title.trim()) {
      alert("Please enter a task title");
      return;
    }

    setIsSubmitting(true);

    const smartDateTime = getSmartDateTime();
    const finalDueDate = dueDate || smartDateTime.dueDate;
    const finalDueTime = time || smartDateTime.time;

    let finalReminderDate = reminderDate;
    let finalReminderTime = reminderTime;

    if (!finalReminderDate) {
      finalReminderDate = finalDueDate;
    }
    if (!finalReminderTime) {
      finalReminderTime = getReminderTimeFromDueTime(finalDueTime);
    }

    onCreate({
      ...(isEditMode && { id: editingTask.id }),

      title: title.trim(),
      description: description.trim(),
      time: finalDueTime,
      dueDate: finalDueDate,
      reminderDate: finalReminderDate,
      reminderTime: finalReminderTime,
      hasReminder: !!(finalReminderDate && finalReminderTime),
      priority,
      isFocused,
      completed: editingTask?.completed || false,
      subtasks,
      color: editingTask?.color || "#60A5FA",
      ...(isEditMode ? { updatedAt: new Date().toISOString() } : { createdAt: new Date().toISOString() }),
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && e.target.tagName !== "TEXTAREA") {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubtaskKeyDown = (e) => {
    if (e.key === "Enter") {
      handleAddSubtask(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative h-full w-96 bg-white/80 backdrop-blur-2xl border-l border-white/50 p-6 shadow-2xl flex flex-col z-10 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5 shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-800">
              {isEditMode ? "Edit Task" : "New Floating Task"}
            </h2>
            {localStorage.getItem("ftb_task_draft") && (
              <Tooltip content="Discard draft and reset">
                <button
                  type="button"
                  onClick={handleDiscardDraft}
                  className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-500 transition cursor-pointer text-xs font-bold flex items-center gap-1"
                >
                  🔄 Reload
                </button>
              </Tooltip>
            )}
          </div>
          <Tooltip content="Close sidebar">
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition cursor-pointer"
            >
              ✕
            </button>
          </Tooltip>
        </div>

        {/* Form */}
        <div className="space-y-4 flex-1">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Task Title</label>
              <span className={`text-[11px] font-semibold ${title.length >= TITLE_MAX ? "text-red-500" : "text-slate-400"}`}>
                {title.length}/{TITLE_MAX}
              </span>
            </div>
            <Tooltip content="Enter task title" className="w-full">
              <input
                type="text"
                placeholder="What needs to be done?"
                maxLength={TITLE_MAX}
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, TITLE_MAX))}
                onKeyDown={handleKeyDown}
                className="w-full p-3 rounded-xl bg-white/60 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#4F7CFF] focus:ring-2 focus:ring-[#4F7CFF]/20 transition"
              />
            </Tooltip>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description</label>
              <span className={`text-[11px] font-semibold ${description.length >= DESCRIPTION_MAX ? "text-red-500" : "text-slate-400"}`}>
                {description.length}/{DESCRIPTION_MAX}
              </span>
            </div>
            <Tooltip content="Enter task description" className="w-full">
              <textarea
                rows={4}
                maxLength={DESCRIPTION_MAX}
                placeholder="Add notes, checklist context, or any helpful detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, DESCRIPTION_MAX))}
                className="w-full p-3 rounded-3xl bg-white/60 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#4F7CFF] focus:ring-2 focus:ring-[#4F7CFF]/20 transition resize-none"
              />
            </Tooltip>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Time</label>
              <Tooltip content="Set due time" className="w-full">
                <input
                  type="time"
                  min={dueDate === new Date().toISOString().split("T")[0] ? `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}` : undefined}
                  value={time}
                  onChange={(e) => handleDueTimeChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full p-3 rounded-xl bg-white/60 border border-slate-200 text-slate-800 focus:outline-none focus:border-[#4F7CFF] focus:ring-2 focus:ring-[#4F7CFF]/20 transition"
                />
              </Tooltip>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Due Date</label>
              <Tooltip content="Set due date" className="w-full">
                <input
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  value={dueDate}
                  onChange={(e) => handleDueDateChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full p-3 rounded-xl bg-white/60 border border-slate-200 text-slate-800 focus:outline-none focus:border-[#4F7CFF] focus:ring-2 focus:ring-[#4F7CFF]/20 transition"
                />
              </Tooltip>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Reminder Time</label>
              <Tooltip content="Set reminder time" className="w-full">
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => handleReminderTimeChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full p-3 rounded-xl bg-white/60 border border-slate-200 text-slate-800 focus:outline-none focus:border-[#4F7CFF] focus:ring-2 focus:ring-[#4F7CFF]/20 transition"
                />
              </Tooltip>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Reminder Date</label>
              <Tooltip content="Set reminder date" className="w-full">
                <input
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  value={reminderDate}
                  onChange={(e) => handleReminderDateChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full p-3 rounded-xl bg-white/60 border border-slate-200 text-slate-800 focus:outline-none focus:border-[#4F7CFF] focus:ring-2 focus:ring-[#4F7CFF]/20 transition"
                />
              </Tooltip>
            </div>
          </div>



          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Priority</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { name: "Low", label: "🌱 Low", color: "hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 active:bg-emerald-100" },
                { name: "Medium", label: "⚡ Medium", color: "hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 active:bg-amber-100" },
                { name: "High", label: "🔥 High", color: "hover:bg-red-50 hover:text-red-600 hover:border-red-200 active:bg-red-100" },
              ].map((p) => {
                const isSel = priority.toLowerCase() === p.name.toLowerCase();
                return (
                  <Tooltip key={p.name} content={`Set ${p.name} priority`} className="w-full">
                    <button
                      type="button"
                      onClick={() => setPriority(p.name)}
                      className={`w-full py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${isSel
                        ? "bg-slate-800 text-white border-slate-800 shadow-sm"
                        : `bg-white/60 text-slate-600 border-slate-200 ${p.color}`
                        }`}
                    >
                      {p.label}
                    </button>
                  </Tooltip>
                );
              })}
            </div>
          </div>

          {/* Subtasks Management Section */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Subtasks ({subtasks.length})</label>
            <div className="space-y-2">
              {/* Add subtask input */}
              <div className="flex gap-2">
                <Tooltip content="Type subtask name" className="flex-1">
                  <input
                    type="text"
                    placeholder="Add a step..."
                    value={newSubtaskText}
                    onChange={(e) => setNewSubtaskText(e.target.value)}
                    onKeyDown={handleSubtaskKeyDown}
                    className="w-full px-3 py-2 rounded-xl bg-white/60 border border-slate-200 text-xs text-slate-800 placeholder-slate-455 focus:outline-none focus:border-[#4F7CFF] focus:ring-1 focus:ring-[#4F7CFF]/15 transition"
                  />
                </Tooltip>
                <Tooltip content="Add step to checklist">
                  <button
                    type="button"
                    onClick={handleAddSubtask}
                    className="px-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition cursor-pointer"
                  >
                    Add
                  </button>
                </Tooltip>
                {/* Subtasks List */}
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                  {subtasks.map((st) => (
                    <div
                      key={st.id}
                      className="flex items-center justify-between p-2.5 bg-white/50 border border-slate-200/50 rounded-xl transition hover:bg-white"
                    >
                      <Tooltip content="Toggle step completion" className="flex-1">
                        <label className="flex items-center gap-2 cursor-pointer select-none w-full">
                          <input
                            type="checkbox"
                            checked={st.done}
                            onChange={() => handleToggleSubtask(st.id)}
                            className="w-4 h-4 rounded text-[#4F7CFF] accent-[#4F7CFF]"
                          />
                          <span className={`text-xs text-slate-700 leading-tight ${st.done ? "line-through text-slate-400" : ""}`}>
                            {st.text}
                          </span>
                        </label>
                      </Tooltip>
                      <Tooltip content="Remove step">
                        <button
                          type="button"
                          onClick={() => handleDeleteSubtask(st.id)}
                          className="text-xs text-slate-455 hover:text-red-500 transition px-1.5 cursor-pointer font-bold"
                        >
                          ✕
                        </button>
                      </Tooltip>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-white/50 rounded-xl border border-slate-200/60">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-700">Mark as Focus Task</span>
                <span className="text-[10px] text-slate-400">Instantly pins to your Focus view</span>
              </div>
              <Tooltip content="Instantly pins to your Focus view">
                <button
                  type="button"
                  onClick={() => setIsFocused(!isFocused)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all cursor-pointer ${isFocused
                    ? "bg-amber-50 border-amber-300 text-amber-500 scale-105"
                    : "bg-white border-slate-200 text-slate-400 hover:bg-slate-50"
                    }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill={isFocused ? "#f59e0b" : "none"}
                    stroke="#f59e0b"
                    strokeWidth="2.5"
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M11.48 3.499c.195-.39.687-.39.882 0l2.399 4.86c.078.158.23.268.404.293l5.367.78c.43.063.602.587.29.897l-3.885 3.787a.482.482 0 0 0-.138.427l.916 5.344c.074.43-.377.757-.76.554l-4.802-2.527a.482.482 0 0 0-.464 0L6.75 19.33c-.383.203-.834-.124-.76-.554l.916-5.344a.482.482 0 0 0-.138-.427L2.883 9.23c-.311-.31-.139-.834.29-.897l5.367-.78a.482.482 0 0 0 .404-.293l2.399-4.86Z"
                    />
                  </svg>
                </button>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-5 shrink-0">
          <Tooltip content="Cancel changes" className="flex-1">
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-sm transition cursor-pointer"
            >
              Cancel
            </button>
          </Tooltip>
          <Tooltip content={isEditMode ? "Save changes" : "Create Bubble"} className="flex-1">
            <button
              onClick={handleSubmit}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm shadow-lg shadow-[#4F7CFF]/25 transition hover:brightness-110 cursor-pointer"
              style={{ background: "linear-gradient(135deg, #4F7CFF, #7c3aed)" }}
            >
              {isEditMode ? "Save Changes" : "Create Bubble 🫧"}
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}

export default AddTaskModal;