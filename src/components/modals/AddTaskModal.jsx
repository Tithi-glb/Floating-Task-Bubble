import { useState } from "react";

function AddTaskModal({ onClose, onCreate, editingTask, defaultPriority = "Medium" }) {
  const [title, setTitle] = useState(editingTask?.title || "");
  const [theme, setTheme] = useState("light");
  const [time, setTime] = useState(editingTask?.time || "");
  const [dueDate, setDueDate] = useState(editingTask?.dueDate || new Date().toISOString().split("T")[0]);
  const [priority, setPriority] = useState(editingTask?.priority || defaultPriority);
  const [isFocused, setIsFocused] = useState(editingTask?.isFocused || false);
  const [subtasks, setSubtasks] = useState(editingTask?.subtasks || []);
  const [newSubtaskText, setNewSubtaskText] = useState("");

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

  const handleSubmit = () => {
    if (!title.trim()) {
      alert("Please enter a task title");
      return;
    }

    onCreate({
      ...(editingTask && { id: editingTask.id }),

      title: title.trim(),

      time: time || "09:00",

      dueDate:
        dueDate || new Date().toISOString().split("T")[0],

      priority,

      isFocused,

      completed: editingTask?.completed || false,

      subtasks,

      color: editingTask?.color || "#60A5FA",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative h-full w-96 bg-white/80 backdrop-blur-2xl border-l border-white/50 p-6 shadow-2xl flex flex-col z-10 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5 shrink-0">
          <h2 className="text-xl font-bold text-slate-800">
            {editingTask ? "Edit Task" : "New Floating Task"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4 flex-1">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Task Title</label>
            <input
              type="text"
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 rounded-xl bg-white/60 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#4F7CFF] focus:ring-2 focus:ring-[#4F7CFF]/20 transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Time</label>
              <input
                type="time"
                min={dueDate === new Date().toISOString().split("T")[0] ? `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}` : undefined}
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full p-3 rounded-xl bg-white/60 border border-slate-200 text-slate-800 focus:outline-none focus:border-[#4F7CFF] focus:ring-2 focus:ring-[#4F7CFF]/20 transition"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Due Date</label>
              <input
                type="date"
                min={new Date().toISOString().split("T")[0]}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full p-3 rounded-xl bg-white/60 border border-slate-200 text-slate-800 focus:outline-none focus:border-[#4F7CFF] focus:ring-2 focus:ring-[#4F7CFF]/20 transition"
              />
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
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => setPriority(p.name)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${isSel
                        ? "bg-slate-800 text-white border-slate-800 shadow-sm"
                        : `bg-white/60 text-slate-600 border-slate-200 ${p.color}`
                      }`}
                  >
                    {p.label}
                  </button>
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
                <input
                  type="text"
                  placeholder="Add a step..."
                  value={newSubtaskText}
                  onChange={(e) => setNewSubtaskText(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-white/60 border border-slate-200 text-xs text-slate-800 placeholder-slate-450 focus:outline-none focus:border-[#4F7CFF] focus:ring-1 focus:ring-[#4F7CFF]/15 transition"
                />
                <button
                  type="button"
                  onClick={handleAddSubtask}
                  className="px-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition cursor-pointer"
                >
                  Add
                </button>
              </div>

              {/* Subtasks List */}
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {subtasks.map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center justify-between p-2.5 bg-white/50 border border-slate-200/50 rounded-xl transition hover:bg-white"
                  >
                    <label className="flex items-center gap-2 cursor-pointer select-none flex-1">
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
                    <button
                      type="button"
                      onClick={() => handleDeleteSubtask(st.id)}
                      className="text-xs text-slate-450 hover:text-red-500 transition px-1.5 cursor-pointer font-bold"
                    >
                      ✕
                    </button>
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
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-5 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-sm transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-3 rounded-xl text-white font-semibold text-sm shadow-lg shadow-[#4F7CFF]/25 transition hover:brightness-110 cursor-pointer"
            style={{ background: "linear-gradient(135deg, #4F7CFF, #7c3aed)" }}
          >
            {editingTask ? "Save Changes" : "Create Bubble 🫧"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddTaskModal;