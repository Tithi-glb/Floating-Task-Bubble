import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BubbleToolbar from "./BubbleToolbar";
import TaskTooltip from "./TaskTooltip";

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  if (!dateStr) return "";
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  d.setHours(0, 0, 0, 0);
  if (d.getTime() === today.getTime()) return "Today";
  if (d.getTime() === tomorrow.getTime()) return "Tomorrow";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatTime(timeStr) {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12}:${m} ${ampm}`;
}

function isOverdue(task) {
  if (task.completed || !task.dueDate) return false;
  const now = new Date();
  if (task.time) {
    const dl = new Date(`${task.dueDate}T${task.time}:00`);
    return !isNaN(dl) && dl < now;
  }
  const d = new Date(task.dueDate);
  d.setHours(23, 59, 59, 999);
  return d < now;
}

// ─── Filled Priority-based gradient backgrounds ─────────────────────────────

function getFilledBackground(task, overdue) {
  if (task.completed) {
    return "linear-gradient(135deg, #94a3b8 0%, #64748b 100%)"; // Gray gradient
  }
  if (overdue) {
    return "linear-gradient(135deg, #b91c1c 0%, #7f1d1d 100%)"; // Dark Red gradient
  }
  switch (task.priority) {
    case "High":
      return "linear-gradient(135deg, #f87171 0%, #dc2626 100%)"; // Deep Red gradient
    case "Low":
      return "linear-gradient(135deg, #34d399 0%, #059669 100%)"; // Green gradient
    default: // Medium
      return "linear-gradient(135deg, #fbbf24 0%, #d97706 100%)"; // Orange/Yellow gradient
  }
}

function getBubbleTheme(task) {
  if (task.completed) {
    return {
      glow: "rgba(148,163,184,0.45)",
      glowStrong: "rgba(100,116,139,0.6)",
      border: "rgba(100,116,139,0.5)",
      waterColor: "rgba(14, 165, 233, 0.4)",
      waterTop: "rgba(56, 189, 248, 0.25)",
      timeColor: "text-black/85",
    };
  }
  if (isOverdue(task)) {
    return {
      glow: "rgba(185,28,28,0.55)",
      glowStrong: "rgba(153,27,27,0.85)",
      border: "rgba(153,27,27,0.75)",
      waterColor: "rgba(14, 165, 233, 0.65)",
      waterTop: "rgba(56, 189, 248, 0.45)",
      timeColor: "text-black/90 font-black",
    };
  }
  switch (task.priority) {
    case "High":
      return {
        glow: "rgba(220,38,38,0.45)",
        glowStrong: "rgba(239,68,68,0.7)",
        border: "rgba(220,38,38,0.65)",
        waterColor: "rgba(14, 165, 233, 0.65)",
        waterTop: "rgba(56, 189, 248, 0.45)",
        timeColor: "text-black/90 font-bold",
      };
    case "Low":
      return {
        glow: "rgba(16,185,129,0.45)",
        glowStrong: "rgba(52,211,153,0.7)",
        border: "rgba(16,185,129,0.6)",
        waterColor: "rgba(14, 165, 233, 0.65)",
        waterTop: "rgba(56, 189, 248, 0.45)",
        timeColor: "text-black/90",
      };
    default: // Medium
      return {
        glow: "rgba(245,158,11,0.45)",
        glowStrong: "rgba(251,191,36,0.7)",
        border: "rgba(217,119,6,0.6)",
        waterColor: "rgba(14, 165, 233, 0.65)",
        waterTop: "rgba(56, 189, 248, 0.45)",
        timeColor: "text-black/90",
      };
  }
}

const sizeMap = {
  High: { px: 130, hoverPx: 148, badge: "🔥" },
  Medium: { px: 115, hoverPx: 130, badge: "⚡" },
  Low: { px: 100, hoverPx: 114, badge: "🌱" },
};

// ─── Main Bubble Component ───────────────────────────────────────────────────

export default function Bubble({
  task,
  onEdit,
  onDelete,
  onComplete,
  onToggleFocus,
  onUpdateTask,
  activeTooltipTask,
  setActiveTooltipTask,
  activeProgressTask,
  setActiveProgressTask,
}) {
  const { px, hoverPx, badge } = sizeMap[task.priority] || sizeMap.Medium;

  const subtasks = task.subtasks || [];
  const doneCount = subtasks.filter((s) => s.done).length;
  const totalSubs = subtasks.length;
  const progress = totalSubs > 0 ? Math.round((doneCount / totalSubs) * 100) : (task.completed ? 100 : 0);

  const [isUrgent, setIsUrgent] = useState(false);
  const [isCritical, setIsCritical] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [toolbarPosition, setToolbarPosition] = useState("right");

  const containerRef = useRef(null);
  const bubbleRef = useRef(null);

  const overdue = isOverdue(task);
  const theme = getBubbleTheme(task);

  // Sync state derived variables
  const showTooltip = activeTooltipTask === task.id;
  const showProgress = activeProgressTask === task.id;

  // Reposition toolbar smartly based on screen boundaries
  const checkPositioning = () => {
    if (bubbleRef.current) {
      const rect = bubbleRef.current.getBoundingClientRect();
      const toolbarWidth = 320;
      const spaceRight = window.innerWidth - rect.right;
      const spaceLeft = rect.left;

      if (spaceRight >= toolbarWidth + 20) {
        setToolbarPosition("right");
      } else if (spaceLeft >= toolbarWidth + 20) {
        setToolbarPosition("left");
      } else {
        setToolbarPosition("above");
      }
    }
  };

  // Adjust on hover start & drag
  const handleMouseEnter = () => {
    setShowToolbar(true);
    checkPositioning();
  };

  const handleMouseLeave = () => {
    setShowToolbar(false);
  };

  const handleBubbleClick = (e) => {
    e.stopPropagation();
    if (showTooltip) {
      setActiveTooltipTask(null);
      setIsEditing(false);
    } else {
      setActiveTooltipTask(task.id);
    }
  };

  // Check window resize dynamically to reposition toolbar
  useEffect(() => {
    if (showToolbar) {
      window.addEventListener("resize", checkPositioning);
      return () => window.removeEventListener("resize", checkPositioning);
    }
  }, [showToolbar]);

  // Check urgency (< 1 hr) and critical alert (< 15 min or overdue)
  useEffect(() => {
    const check = () => {
      if (task.completed) {
        setIsUrgent(false);
        setIsCritical(false);
        return;
      }
      const overdueState = isOverdue(task);
      if (!task.dueDate || !task.time) {
        setIsUrgent(false);
        setIsCritical(overdueState);
        return;
      }
      const dl = new Date(`${task.dueDate}T${task.time}:00`);
      if (isNaN(dl.getTime())) {
        setIsUrgent(false);
        setIsCritical(overdueState);
        return;
      }
      const diff = dl - new Date();
      setIsUrgent(diff > 0 && diff <= 60 * 60 * 1000);
      setIsCritical(overdueState || (diff > 0 && diff <= 15 * 60 * 1000));
    };
    check();
    const id = setInterval(check, 10000);
    return () => clearInterval(id);
  }, [task.dueDate, task.time, task.completed]);

  // Determine tooltip opposite position to prevent overlap
  const getTooltipPosition = () => {
    if (toolbarPosition === "right") return "left";
    if (toolbarPosition === "left") return "right";
    return "bottom"; // Toolbar is above, tooltip displays below
  };

  // ── Visual Styling ──────────────────────────────────────────────────────────

  const glowBase = `0 0 28px ${theme.glow}, 0 0 60px ${overdue || isUrgent ? theme.glowStrong : theme.glow + "55"}`;
  const glowStrong = `0 0 36px ${theme.glowStrong}, 0 0 80px ${theme.glowStrong}88`;
  const boxShadow = `
    inset 0 10px 26px rgba(255,255,255,${task.completed ? 0.35 : 0.65}),
    inset 0 -8px 18px rgba(0,0,0,0.06),
    inset -4px 0 14px rgba(255,255,255,0.12),
    ${isUrgent || overdue ? glowStrong : glowBase},
    0 8px 32px rgba(0,0,0,0.12)
  `;

  // Dynamic font size for long titles
  const titleFontSize =
    task.title.length > 35 ? "text-[9px]" :
      task.title.length > 25 ? "text-[10px]" :
        task.title.length > 18 ? "text-xs" :
          task.priority === "High" ? "text-sm" :
            task.priority === "Low" ? "text-[11px]" : "text-xs";

  const borderStyle = overdue
    ? `2.5px solid rgba(185,28,28,0.8)`
    : isUrgent
      ? `2.5px solid rgba(239,68,68,0.85)`
      : task.isFocused
        ? `2.5px solid rgba(245,158,11,0.9)`
        : task.completed
          ? `1.5px solid rgba(100,116,139,0.4)`
          : `1.5px solid ${theme.border}`;

  const floatAnimation = isCritical
    ? {
      x: [0, -1.5, 1.5, -1.5, 1.5, 0],
      y: [0, -1, 1, -1, 1, 0],
      rotate: [0, -0.5, 0.5, -0.5, 0.5, 0],
      boxShadow: [boxShadow, `inset 0 10px 26px rgba(255,255,255,0.55), 0 0 50px ${theme.glowStrong}, 0 0 90px ${theme.glowStrong}66`, boxShadow]
    }
    : {
      y: [0, -8, 0],
      ...(isUrgent
        ? { boxShadow: [boxShadow, `inset 0 10px 26px rgba(255,255,255,0.55), 0 0 50px ${theme.glowStrong}, 0 0 90px ${theme.glowStrong}66`, boxShadow] }
        : {}),
    };

  const floatTransition = isCritical
    ? {
      x: { duration: 0.35, repeat: Infinity, ease: "linear" },
      y: { duration: 0.35, repeat: Infinity, ease: "linear" },
      rotate: { duration: 0.35, repeat: Infinity, ease: "linear" },
      boxShadow: { duration: 0.5, repeat: Infinity, ease: "easeInOut", repeatType: "reverse" }
    }
    : {
      y: { duration: 3.2 + (Number(task.id) % 5) * 0.4, repeat: Infinity, ease: "easeInOut" },
      ...(isUrgent
        ? { boxShadow: { duration: 0.6, repeat: Infinity, ease: "easeInOut", repeatType: "reverse" } }
        : {}),
    };

  return (
    <div
      ref={containerRef}
      style={{ width: px + 20, height: px + 20, position: "relative" }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Draggable Bubble Sphere Container */}
      <motion.div
        ref={bubbleRef}
        drag
        dragMomentum={false}
        onDrag={checkPositioning}
        whileDrag={{ scale: 1.05 }}
        whileHover={{ width: hoverPx, height: hoverPx, zIndex: 100 }}
        onClick={handleBubbleClick}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className="cursor-pointer relative z-10"
        style={{ width: px, height: px, position: "absolute", top: 10, left: 10 }}
      >
        {/* Sphere body */}
        <motion.div
          animate={floatAnimation}
          transition={floatTransition}
          style={{
            width: "100%",
            height: "100%",
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: getFilledBackground(task, overdue),
            border: borderStyle,
            boxShadow,
            opacity: task.completed ? 0.65 : 1,
            filter: task.completed ? "saturate(0.4) brightness(0.9)" : "none",
            transition: "opacity 0.3s, filter 0.3s, background 0.4s",
          }}
          className="flex flex-col items-center justify-center select-none overflow-hidden"
        >
          {/* Water progress fill */}
          {progress > 0 && (
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", overflow: "hidden", zIndex: 1, pointerEvents: "none" }}>
              <div
                style={{
                  position: "absolute", bottom: 0, left: 0, right: 0,
                  height: `${progress}%`,
                  background: `linear-gradient(to top, ${theme.waterColor} 0%, ${theme.waterTop} 100%)`,
                  transition: "height 0.8s cubic-bezier(0.4,0,0.2,1)",
                }}
              >
                <div className="absolute w-[200%] h-[200%] rounded-[40%] opacity-20"
                  style={{ bottom: "95%", left: "-50%", background: "rgba(255,255,255,0.25)", animation: "waveRotate 8s linear infinite" }} />
              </div>
            </div>
          )}

          {/* 3D Glass highlights */}
          <div className="absolute inset-0 rounded-full pointer-events-none z-10"
            style={{ background: "radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0) 50%)" }} />
          <div className="absolute top-2 left-6 right-6 h-4 bg-gradient-to-b from-white/60 to-white/0 rounded-full blur-[0.5px] pointer-events-none z-10" />
          <div className="absolute bottom-5 right-7 w-5 h-5 bg-white/20 rounded-full blur-md pointer-events-none z-10" />

          {/* Priority Icon */}
          <span className="absolute top-7 text-[11px] pointer-events-none select-none z-20">
            {task.completed ? "✅" : overdue ? "⚠️" : badge}
          </span>

          {/* Content (Text is always solid black/dark for readability) */}
          <div className="text-center px-3.5 mt-1 select-none pointer-events-none flex flex-col items-center justify-center z-20 relative text-black">
            <h2 className={`font-black tracking-tight leading-tight text-center break-words flex items-center justify-center gap-0.5 ${titleFontSize}`} style={{ color: "#111111" }}>
              {task.isFocused && <span className="text-amber-600">★</span>}
              {task.title}
            </h2>
            <p className={`text-[9px] mt-0.5 font-bold leading-none ${theme.timeColor}`} style={{ color: "#111111" }}>
              {formatTime(task.time)}
            </p>
            <p className="text-[7.5px] mt-0.5 uppercase tracking-wider font-extrabold" style={{ color: "rgba(17,17,17,0.75)" }}>
              {formatDate(task.dueDate)}
            </p>
            {totalSubs > 0 && (
              <div className="mt-1 flex items-center justify-center gap-0.5 bg-black/10 px-1.5 py-0.5 rounded-full border border-black/10 backdrop-blur-xs">
                <span className="text-[8px] font-black text-black">{doneCount}/{totalSubs}</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Floating Action Toolbar attached to bubble inside draggable motion.div */}
        <BubbleToolbar
          task={task}
          onEdit={() => { setIsEditing(true); setActiveTooltipTask(task.id); }}
          onDelete={onDelete}
          onComplete={onComplete}
          onToggleFocus={onToggleFocus}
          onUpdateTask={onUpdateTask}
          onOpenProgress={setActiveProgressTask} // Only update activeProgressTask
          visible={showToolbar}
          position={toolbarPosition}
          bubbleSize={px}
        />

        {/* Overdue Badge attached to bubble inside draggable motion.div */}
        {overdue && !task.completed && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute -top-7 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest z-30 whitespace-nowrap"
            style={{ background: "rgba(185,28,28,0.9)", color: "white", backdropFilter: "blur(8px)" }}
          >
            ⚠ OVERDUE
          </motion.div>
        )}

        {/* Compact Tooltip / Mini Task Card attached to bubble inside draggable motion.div */}
        <AnimatePresence>
          {showTooltip && (
            <TaskTooltip
              task={task}
              isOpen={showTooltip}
              isEditing={isEditing}
              setIsEditing={setIsEditing}
              onClose={() => { setActiveTooltipTask(null); setIsEditing(false); }}
              onUpdateTask={onUpdateTask}
              position={getTooltipPosition()}
              bubbleSize={px}
              bubbleContainerRef={containerRef}
            />
          )}
        </AnimatePresence>
      </motion.div>

      <style>{`
        @keyframes waveRotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}