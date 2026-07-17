import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BubbleToolbar from "./BubbleToolbar";

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
  // If no time, check if the date itself is past
  const d = new Date(task.dueDate);
  d.setHours(23, 59, 59, 999);
  return d < now;
}

// ─── Priority-based deep colour palettes ─────────────────────────────────────

function getBubbleTheme(task) {
  if (task.completed) {
    return {
      glow: "rgba(71,85,105,0.35)",
      glowStrong: "rgba(71,85,105,0.55)",
      border: "rgba(100,116,139,0.4)",
      waterColor: "rgba(71,85,105,0.28)",
      waterTop: "rgba(100,116,139,0.18)",
      label: "text-slate-400",
      timeColor: "text-slate-400",
    };
  }
  if (isOverdue(task)) {
    return {
      glow: "rgba(139,0,0,0.5)",
      glowStrong: "rgba(185,28,28,0.75)",
      border: "rgba(185,28,28,0.7)",
      waterColor: "rgba(185,28,28,0.35)",
      waterTop: "rgba(239,68,68,0.22)",
      label: "text-red-900",
      timeColor: "text-red-700 font-extrabold",
    };
  }
  switch (task.priority) {
    case "High":
      return {
        glow: "rgba(185,28,28,0.4)",
        glowStrong: "rgba(220,38,38,0.65)",
        border: "rgba(220,38,38,0.6)",
        waterColor: "rgba(220,38,38,0.3)",
        waterTop: "rgba(239,68,68,0.18)",
        label: "text-red-900",
        timeColor: "text-red-800",
      };
    case "Low":
      return {
        glow: "rgba(21,128,61,0.38)",
        glowStrong: "rgba(22,163,74,0.6)",
        border: "rgba(22,163,74,0.55)",
        waterColor: "rgba(22,163,74,0.28)",
        waterTop: "rgba(34,197,94,0.16)",
        label: "text-green-900",
        timeColor: "text-green-800",
      };
    default: // Medium
      return {
        glow: "rgba(194,65,12,0.38)",
        glowStrong: "rgba(234,88,12,0.62)",
        border: "rgba(234,88,12,0.55)",
        waterColor: "rgba(234,88,12,0.28)",
        waterTop: "rgba(249,115,22,0.16)",
        label: "text-orange-900",
        timeColor: "text-orange-800",
      };
  }
}

// ─── Bubble Component ────────────────────────────────────────────────────────

const sizeMap = {
  High:   { px: 130, hoverPx: 150, badge: "🔥" },
  Medium: { px: 115, hoverPx: 132, badge: "⚡" },
  Low:    { px: 100, hoverPx: 116, badge: "🌱" },
};

function Bubble({ task, onEdit, onDelete, onComplete, onToggleFocus, onUpdateTask, onOpenProgress }) {
  const { px, hoverPx, badge } = sizeMap[task.priority] || sizeMap.Medium;

  const subtasks = task.subtasks || [];
  const doneCount = subtasks.filter((s) => s.done).length;
  const totalSubs = subtasks.length;
  const progress = totalSubs > 0 ? Math.round((doneCount / totalSubs) * 100) : (task.completed ? 100 : 0);

  const [isUrgent, setIsUrgent] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const overdue = isOverdue(task);
  const theme = getBubbleTheme(task);

  useEffect(() => {
    const check = () => {
      if (!task.dueDate || !task.time || task.completed) return;
      const dl = new Date(`${task.dueDate}T${task.time}:00`);
      if (isNaN(dl)) return;
      const diff = dl - new Date();
      setIsUrgent(diff > 0 && diff <= 60 * 60 * 1000);
    };
    check();
    const id = setInterval(check, 10000);
    return () => clearInterval(id);
  }, [task.dueDate, task.time, task.completed]);

  // ── Visual styling ──────────────────────────────────────────────────────────

  const glowBase = `0 0 28px ${theme.glow}, 0 0 60px ${overdue || isUrgent ? theme.glowStrong : theme.glow + "55"}`;
  const glowStrong = `0 0 36px ${theme.glowStrong}, 0 0 80px ${theme.glowStrong}88`;
  const boxShadow = `
    inset 0 10px 26px rgba(255,255,255,${task.completed ? 0.3 : 0.72}),
    inset 0 -8px 18px rgba(0,0,0,0.06),
    inset -4px 0 14px rgba(255,255,255,0.12),
    ${isUrgent || overdue ? glowStrong : glowBase},
    0 8px 32px rgba(0,0,0,0.12)
  `;

  const bubbleBg = task.completed
    ? `radial-gradient(circle at 30% 22%, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.1) 30%, transparent 55%),
       radial-gradient(circle at 70% 75%, rgba(148,163,184,0.12) 0%, transparent 50%)`
    : `radial-gradient(circle at 28% 22%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.22) 28%, transparent 55%),
       radial-gradient(circle at 72% 78%, rgba(255,255,255,0.18) 0%, transparent 48%),
       radial-gradient(circle at 18% 68%, rgba(255,255,255,0.12) 0%, transparent 42%),
       radial-gradient(circle at 65% 25%, rgba(255,255,255,0.1) 0%, transparent 38%)`;

  const borderStyle = overdue
    ? `2.5px solid rgba(185,28,28,0.75)`
    : isUrgent
      ? `2.5px solid rgba(239,68,68,0.85)`
      : task.isFocused
        ? `2px solid rgba(245,158,11,0.85)`
        : task.completed
          ? `1.5px solid rgba(100,116,139,0.35)`
          : `1.5px solid ${theme.border}`;

  // Dynamic font size for long titles
  const titleFontSize =
    task.title.length > 35 ? "text-[9px]" :
    task.title.length > 25 ? "text-[10px]" :
    task.title.length > 18 ? "text-xs" :
    task.priority === "High" ? "text-base" :
    task.priority === "Low"  ? "text-sm" : "text-[13px]";

  const floatAnimation = {
    y: [0, -10, 0],
    ...(isUrgent || overdue
      ? { boxShadow: [boxShadow, `inset 0 10px 26px rgba(255,255,255,0.65), 0 0 50px ${theme.glowStrong}, 0 0 90px ${theme.glowStrong}66`, boxShadow] }
      : {}),
  };

  const floatTransition = {
    y: { duration: 3.2 + (Number(task.id) % 5) * 0.4, repeat: Infinity, ease: "easeInOut" },
    ...(isUrgent || overdue
      ? { boxShadow: { duration: 0.55, repeat: Infinity, ease: "easeInOut", repeatType: "reverse" } }
      : {}),
  };

  return (
    <div
      style={{ width: px + 20, height: px + 20, position: "relative" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Hover Toolbar */}
      <BubbleToolbar
        task={task}
        onEdit={onEdit}
        onDelete={onDelete}
        onComplete={onComplete}
        onToggleFocus={onToggleFocus}
        onUpdateTask={(patch) => onUpdateTask && onUpdateTask(task.id, patch)}
        onOpenProgress={onOpenProgress}
        visible={isHovered}
      />

      {/* Overdue badge */}
      {overdue && !task.completed && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest z-30 whitespace-nowrap"
          style={{ background: "rgba(185,28,28,0.85)", color: "white", backdropFilter: "blur(8px)" }}
        >
          ⚠ OVERDUE
        </motion.div>
      )}

      <motion.div
        drag
        dragMomentum={false}
        whileDrag={{ scale: 1.06 }}
        whileHover={{ width: hoverPx, height: hoverPx, zIndex: 100 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className="cursor-grab active:cursor-grabbing"
        style={{ width: px, height: px, position: "absolute", top: 10, left: 10 }}
      >
        {/* Main bubble sphere */}
        <motion.div
          animate={floatAnimation}
          transition={floatTransition}
          style={{
            width: "100%",
            height: "100%",
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: bubbleBg,
            border: borderStyle,
            boxShadow,
            opacity: task.completed ? 0.5 : 1,
            filter: task.completed ? "saturate(0.3) brightness(0.85)" : "none",
            transition: "opacity 0.4s, filter 0.4s",
          }}
          className="flex flex-col items-center justify-center select-none"
        >
          {/* Progress water fill */}
          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", overflow: "hidden", zIndex: 1, pointerEvents: "none" }}>
            {progress > 0 && (
              <div
                style={{
                  position: "absolute", bottom: 0, left: 0, right: 0,
                  height: `${progress}%`,
                  background: `linear-gradient(to top, ${theme.waterColor} 0%, ${theme.waterTop} 100%)`,
                  transition: "height 0.9s cubic-bezier(0.4,0,0.2,1)",
                }}
              >
                <div className="absolute w-[200%] h-[200%] rounded-[40%] opacity-30"
                  style={{ bottom: "95%", left: "-50%", background: "rgba(255,255,255,0.2)", animation: "waveRotate 8s linear infinite" }} />
                <div className="absolute w-[210%] h-[210%] rounded-[38%] opacity-20"
                  style={{ bottom: "90%", left: "-55%", background: "rgba(255,255,255,0.15)", animation: "waveRotate 12s linear infinite reverse" }} />
              </div>
            )}
          </div>

          {/* Gloss highlights */}
          <div className="absolute top-3 left-7 right-7 h-5 bg-gradient-to-b from-white/70 to-white/0 rounded-full blur-[1px] pointer-events-none z-10" />
          <div className="absolute bottom-6 right-8 w-6 h-6 bg-white/30 rounded-full blur-md pointer-events-none z-10" />

          {/* Priority badge */}
          <span className="absolute top-7 text-xs pointer-events-none select-none z-20">
            {task.completed ? "✅" : overdue ? "⚠️" : badge}
          </span>

          {/* Content */}
          <div className="text-center px-3 mt-1 select-none pointer-events-none flex flex-col items-center justify-center z-20 relative">
            <h2 className={`text-slate-800 font-extrabold tracking-tight leading-tight drop-shadow-sm text-center break-words flex items-center justify-center gap-1 ${titleFontSize} ${task.completed ? "line-through opacity-60" : ""}`}>
              {task.isFocused && <span className="text-amber-500">★</span>}
              {task.title}
            </h2>
            <p className={`text-[10px] mt-0.5 font-semibold leading-none ${theme.timeColor}`}>
              {formatTime(task.time)}
            </p>
            <p className={`text-[8px] mt-0.5 uppercase tracking-wider font-bold ${overdue ? "text-red-700" : "text-slate-500/80"}`}>
              {formatDate(task.dueDate)}
            </p>
            {totalSubs > 0 && (
              <div className="mt-1 flex items-center justify-center gap-0.5 bg-white/30 px-1.5 py-0.5 rounded-full border border-white/20 backdrop-blur-xs">
                <span className="text-[8px] font-bold text-slate-600">{doneCount}/{totalSubs}</span>
                <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="rgba(100,120,180,0.9)" strokeWidth="3.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            )}
          </div>
        </motion.div>
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

export default Bubble;