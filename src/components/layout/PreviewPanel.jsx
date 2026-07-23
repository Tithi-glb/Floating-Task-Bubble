import { FloatingBubbleSystem } from "../bubbles";

function PreviewPanel({
  theme,
  tasks,
  isDesktopMode,
  isModalOpen,
  focusMode,
  setFocusMode,
  onEdit,
  onDelete,
  onComplete,
  onToggleFocus,
  onUpdateTask,
  onAddTask,
}) {
  return (
    <div
      className={`
        flex-grow
        relative
        overflow-hidden
        transition-all
        duration-500
        ${isDesktopMode
          ? "bg-transparent"
          : theme === "dark"
            ? "bg-slate-950 text-slate-100"
            : "bg-gradient-to-br from-[#F4F8FF] via-[#EAF2FF] to-[#F3E8FF]"
        }
        ${isModalOpen ? "opacity-80" : "opacity-100"}
      `}
    >
      {/* Background orbs */}
      <div
        className="absolute inset-0"
        style={{
          background:
            theme === "dark"
              ? "radial-gradient(circle at top left, rgba(96,165,250,0.07) 0%, transparent 35%), radial-gradient(circle at bottom right, rgba(148,163,184,0.1) 0%, transparent 45%)"
              : "radial-gradient(circle at top left, rgba(79,124,255,0.14) 0%, transparent 35%), radial-gradient(circle at bottom right, rgba(243,232,255,0.7) 0%, transparent 45%)",
        }}
      />
      <div className="absolute top-16 left-16 w-10 h-10 rounded-full bg-[#4F7CFF]/12 blur-sm" />
      <div className="absolute top-32 right-24 w-20 h-20 rounded-full bg-[#DCEEFF]/60 blur-md" />
      <div className="absolute bottom-24 left-1/3 w-14 h-14 rounded-full bg-[#F3E8FF]/75 blur-md" />
      <div className="absolute top-1/2 right-1/4 w-8 h-8 rounded-full bg-[#4F7CFF]/18 blur-sm" />
      <div className="absolute bottom-12 right-20 w-24 h-24 rounded-full bg-white/60 blur-lg" />

      {/* Focus Mode exit button */}
      {focusMode && (
        <button
          onClick={() => setFocusMode(false)}
          className="absolute top-6 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-full bg-white/70 backdrop-blur-md border border-[#4F7CFF]/30 hover:border-[#4F7CFF] text-[#4F7CFF] hover:bg-[#EEF4FF] font-bold text-xs shadow-md transition-all duration-200 cursor-pointer flex items-center gap-1.5 z-40 hover:scale-105 active:scale-95"
        >
          <span>🎯</span>
          <span>Exit Focus Mode</span>
        </button>
      )}

      {/* Empty state */}
      {tasks.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div
            className={`w-full max-w-130 rounded-3xl backdrop-blur-xl p-10 text-center shadow-2xl ${theme === "dark"
                ? "bg-slate-900/90 border border-slate-800 text-slate-100"
                : "bg-white/80 border border-white/50 text-slate-900"
              }`}
          >
            <div className="mx-auto w-28 h-28 rounded-full bg-gradient-to-br from-[#4F7CFF] to-[#A855F7] shadow-lg flex items-center justify-center text-5xl mb-6">
              🫧
            </div>
            <h1 className={`text-3xl font-bold ${theme === "dark" ? "text-slate-100" : "text-[#0F172A]"}`}>
              Welcome to Floating Task Bubble
            </h1>
            <p className={`mt-3 text-base ${theme === "dark" ? "text-slate-300" : "text-gray-500"}`}>
              Manage your tasks with beautiful floating bubbles.
              Stay organized, focused, and productive.
            </p>
            <div className="grid grid-cols-3 gap-4 mt-8">
              {[
                { icon: "➕", label: "Create Task", bg: theme === "dark" ? "bg-slate-800" : "bg-[#F4F8FF]" },
                { icon: "🎯", label: "Focus Mode", bg: theme === "dark" ? "bg-slate-800" : "bg-[#F5ECFF]" },
                { icon: "📅", label: "Plan Day", bg: theme === "dark" ? "bg-slate-800" : "bg-[#ECFDF5]" },
              ].map((c) => (
                <div key={c.label} className={`rounded-2xl p-4 hover:scale-105 transition cursor-default ${c.bg}`}>
                  <div className="text-2xl">{c.icon}</div>
                  <p className="mt-2 text-sm font-semibold">{c.label}</p>
                </div>
              ))}
            </div>
            <button
              onClick={onAddTask}
              className="mt-8 px-8 py-3 rounded-full bg-[#4F7CFF] text-white font-semibold shadow-lg hover:scale-105 transition cursor-pointer"
            >
              Create Your First Task
            </button>
          </div>
        </div>
      )}

      {/* Bubble Canvas */}
      {tasks.length > 0 && (
        <FloatingBubbleSystem
          tasks={tasks}
          theme={theme}
          onEdit={onEdit}
          onDelete={onDelete}
          onComplete={onComplete}
          onToggleFocus={onToggleFocus}
          onUpdateTask={onUpdateTask}
        />
      )}
    </div>
  );
}

export default PreviewPanel;