import { useState } from "react";
import Bubble from "./Bubble";
import ProgressTracker from "../layout/ProgressTracker";

const positions = [
  { top: "10%", left: "10%" },
  { top: "55%", left: "18%" },
  { top: "20%", left: "48%" },
  { top: "62%", left: "68%" },
  { top: "32%", left: "78%" },
  { top: "72%", left: "42%" },
  { top: "15%", left: "72%" },
  { top: "45%", left: "35%" },
];

export default function FloatingBubbleSystem({
  tasks,
  theme,
  onEdit,
  onDelete,
  onComplete,
  onToggleFocus,
  onUpdateTask,
}) {
  const [activeTooltipTask, setActiveTooltipTask] = useState(null);
  const [activeProgressTask, setActiveProgressTask] = useState(null);

  return (
    <>
      {/* Bubble canvas */}
      {tasks.map((task, index) => (
        <div
          key={task.id}
          className="absolute"
          style={positions[index % positions.length]}
        >
          <Bubble
            task={task}
            onEdit={onEdit}
            onDelete={onDelete}
            onComplete={onComplete}
            onToggleFocus={onToggleFocus}
            onUpdateTask={onUpdateTask}
            activeTooltipTask={activeTooltipTask}
            setActiveTooltipTask={setActiveTooltipTask}
            activeProgressTask={activeProgressTask}
            setActiveProgressTask={setActiveProgressTask}
          />
        </div>
      ))}

      {/* Independent Progress Tracker Panel Modal */}
      {activeProgressTask && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-slate-950/40 backdrop-blur-md p-6">
          <div
            className="w-full max-w-[900px] h-[85%] rounded-[30px] shadow-2xl overflow-hidden border border-white/20 relative"
            style={{
              background: theme === "dark" ? "rgba(15, 23, 42, 0.95)" : "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(24px)",
            }}
          >
            <ProgressTracker
              tasks={tasks}
              theme={theme}
              onClose={() => setActiveProgressTask(null)}
            />
          </div>
        </div>
      )}
    </>
  );
}
