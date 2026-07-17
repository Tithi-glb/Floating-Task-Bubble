import { useState, useEffect } from "react";
import { motion } from "framer-motion";

// Format ISO date to human-friendly label
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

function formatLongDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

// Format HH:MM to 12h format
function formatTime(timeStr) {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12}:${m} ${ampm}`;
}

function Bubble({ task, onEdit, onDelete, onComplete, onToggleFocus, onToggleSubtask, isTooltipOpen, onToggleTooltip }) {
  const tooltipOpen = Boolean(isTooltipOpen);
  // Bubble size based on priority
  const sizeMap = {
    High: {
      px: 130,
      hoverPx: 160,
      titleSize: "text-lg",
      timeSize: "text-xs",
      badge: "🔥",
    },
    Medium: {
      px: 115,
      hoverPx: 144,
      titleSize: "text-base",
      timeSize: "text-[11px]",
      badge: "⚡",
    },
    Low: {
      px: 100,
      hoverPx: 128,
      titleSize: "text-sm",
      timeSize: "text-[10px]",
      badge: "🌱",
    },
  };

  const { px, hoverPx, titleSize, timeSize, badge } =
    sizeMap[task.priority] || sizeMap.Medium;

  // Progress from subtasks
  const subtasks = task.subtasks || [];
  const doneCount = subtasks.filter(s => s.done).length;
  const totalSubs = subtasks.length;
  const progress = totalSubs > 0 ? Math.round((doneCount / totalSubs) * 100) : (task.completed ? 100 : 0);

  // Priority-based bubble colours
  const priorityStyles = {
    High: {
      tint: "#fb923c",
      background: `
      radial-gradient(circle at 28% 22%, rgba(255,255,255,0.95) 0%, rgba(255,244,229,0.88) 28%, transparent 55%),
      radial-gradient(circle at 72% 78%, rgba(251,146,60,0.25) 0%, transparent 48%),
      radial-gradient(circle at 18% 68%, rgba(253,186,116,0.2) 0%, transparent 42%),
      radial-gradient(circle at 65% 25%, rgba(251,146,60,0.16) 0%, transparent 38%)
      `,
    },
    Medium: {
      tint: "#facc15",
      background: `
      radial-gradient(circle at 28% 22%, rgba(255,255,255,0.95) 0%, rgba(255,251,204,0.88) 28%, transparent 55%),
      radial-gradient(circle at 72% 78%, rgba(250,204,21,0.25) 0%, transparent 48%),
      radial-gradient(circle at 18% 68%, rgba(253,230,138,0.2) 0%, transparent 42%),
      radial-gradient(circle at 65% 25%, rgba(250,204,21,0.16) 0%, transparent 38%)
      `,
    },
    Low: {
      tint: "#4ade80",
      background: `
      radial-gradient(circle at 28% 22%, rgba(255,255,255,0.95) 0%, rgba(236,253,245,0.88) 28%, transparent 55%),
      radial-gradient(circle at 72% 78%, rgba(74,222,128,0.25) 0%, transparent 48%),
      radial-gradient(circle at 18% 68%, rgba(167,243,208,0.2) 0%, transparent 42%),
      radial-gradient(circle at 65% 25%, rgba(74,222,128,0.16) 0%, transparent 38%)
      `,
    },
  };
  const { tint, background: priorityBackground } = priorityStyles[task.priority] || priorityStyles.Medium;

  // Urgency State (Deadline in less than 1 hour)
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const checkUrgent = () => {
      if (!task.dueDate || !task.time) return;
      const deadline = new Date(`${task.dueDate}T${task.time}:00`);
      if (isNaN(deadline.getTime())) return;
      const now = new Date();
      const diff = deadline.getTime() - now.getTime();
      setIsUrgent(diff > 0 && diff <= 60 * 60 * 1000);
    };

    checkUrgent();
    const interval = setInterval(checkUrgent, 10000);
    return () => clearInterval(interval);
  }, [task.dueDate, task.time]);

  // Dynamic box shadow and border color for urgent / normal bubbles
  const borderStyle = isUrgent
    ? "3px solid rgba(239, 68, 68, 0.85)"
    : task.isFocused
      ? "2.5px solid rgba(245, 158, 11, 0.9)"
      : "1.5px solid rgba(255,255,255,0.78)";

  const glowShadow = isUrgent
    ? `
      inset 0 8px 22px rgba(255,255,255,0.65),
      inset 0 -6px 16px rgba(239,68,68,0.25),
      0 0 25px rgba(239, 68, 68, 0.5),
      0 0 50px rgba(239, 68, 68, 0.2)
    `
    : task.isFocused
      ? `
      inset 0  8px 22px rgba(255,255,255,0.62),
      inset 0 -6px 16px rgba(100,120,200,0.18),
      inset -4px 0  14px rgba(255,150,200,0.14),
      0 12px 35px rgba(245, 158, 11, 0.4),
      0  2px 10px rgba(100,100,200,0.12)
    `
      : `
      inset 0  8px 22px rgba(255,255,255,0.62),
      inset 0 -6px 16px rgba(100,120,200,0.18),
      inset -4px 0  14px rgba(255,150,200,0.14),
      0 10px 30px ${tint}28,
      0  2px 10px rgba(100,100,200,0.12)
    `;

  // Dynamic background for soap bubbles (urgent turns red-pinkish)
  const soapBackground = isUrgent
    ? `
      radial-gradient(circle at 28% 22%, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.18) 28%, transparent 55%),
      radial-gradient(circle at 72% 78%, rgba(239,68,68,0.2) 0%, transparent 48%),
      radial-gradient(circle at 18% 68%, rgba(255,100,100,0.18) 0%, transparent 42%),
      radial-gradient(circle at 65% 25%, rgba(239,68,68,0.15) 0%, transparent 38%)
    `
    : `
      radial-gradient(circle at 28% 22%, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.18) 28%, transparent 55%),
      radial-gradient(circle at 72% 78%, rgba(180,220,255,0.25) 0%, transparent 48%),
      radial-gradient(circle at 18% 68%, rgba(255,160,220,0.15) 0%, transparent 42%),
      radial-gradient(circle at 65% 25%, rgba(200,255,220,0.12) 0%, transparent 38%)
    `;

  return (
    <>
      <style>{`
        @keyframes waveRotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <motion.div
        drag
        dragMomentum={false}
        whileDrag={{ scale: 1.08 }}
        whileHover={{
          width: hoverPx,
          height: hoverPx,
          zIndex: 100,
        }}
        transition={{
          type: "spring",
          stiffness: 250,
          damping: 20,
        }}
        className="cursor-grab relative active:cursor-grabbing"
        onClick={(e) => {
          e.stopPropagation();
          onToggleTooltip?.();
        }}
        style={{ width: px, height: px }}
      >
        {/* Soap-bubble sphere */}
        <motion.div
          animate={isUrgent ? {
            y: [0, -10, 0],
            boxShadow: [
              glowShadow,
              `inset 0 8px 22px rgba(255,255,255,0.65), inset 0 -6px 16px rgba(239,68,68,0.25), 0 0 35px rgba(239, 68, 68, 0.7), 0 0 70px rgba(239, 68, 68, 0.35)`,
              glowShadow
            ]
          } : { y: [0, -10, 0] }}
          transition={isUrgent ? {
            y: { duration: 3.5 + (parseInt(task.id, 10) % 2 || 0) * 0.8, repeat: Infinity, ease: "easeInOut" },
            boxShadow: { duration: 0.5, repeat: Infinity, ease: "easeInOut" }
          } : { duration: 3.5 + (parseInt(task.id, 10) % 2 || 0) * 0.8, repeat: Infinity, ease: "easeInOut" }}
          style={{
            width: px,
            height: px,
            position: "absolute",
            top: 0,
            left: 0,
            borderRadius: "50%",
            background: isUrgent ? `
              radial-gradient(circle at 28% 22%, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.18) 28%, transparent 55%),
              radial-gradient(circle at 72% 78%, rgba(239,68,68,0.2) 0%, transparent 48%),
              radial-gradient(circle at 18% 68%, rgba(255,100,100,0.18) 0%, transparent 42%),
              radial-gradient(circle at 65% 25%, rgba(239,68,68,0.15) 0%, transparent 38%)
            ` : priorityBackground,
            border: borderStyle,
            boxShadow: glowShadow,
            zIndex: 10,
          }}
          className="flex flex-col items-center justify-center select-none"
        >
          {/* Water level progress container (Confined within the circular bubble boundaries) */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              overflow: "hidden",
              zIndex: 1,
              pointerEvents: "none",
            }}
          >
            {/* Rising Water Element */}
            {progress > 0 && (
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: `${progress}%`,
                  background: isUrgent
                    ? "linear-gradient(to top, rgba(239, 68, 68, 0.4) 0%, rgba(248, 113, 113, 0.25) 100%)"
                    : "linear-gradient(to top, rgba(59, 130, 246, 0.3) 0%, rgba(124, 58, 237, 0.2) 100%)",
                  transition: "height 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              >
                {/* Rotating wave overlay to simulate water ripples */}
                <div
                  className="absolute w-[200%] h-[200%] bg-white/12 rounded-[40%]"
                  style={{
                    bottom: "95%",
                    left: "-50%",
                    transformOrigin: "50% 50%",
                    animation: "waveRotate 8s linear infinite",
                  }}
                />
                <div
                  className="absolute w-[210%] h-[210%] bg-white/8 rounded-[38%] opacity-60"
                  style={{
                    bottom: "90%",
                    left: "-55%",
                    transformOrigin: "50% 50%",
                    animation: "waveRotate 12s linear infinite",
                  }}
                />
              </div>
            )}
          </div>

          {/* Gloss highlight bar */}
          <div className="absolute top-3 left-7 right-7 h-5 bg-gradient-to-b from-white/65 to-white/0 rounded-full blur-[1px] pointer-events-none z-15" />
          {/* Secondary shine dot */}
          <div className="absolute bottom-6 right-8 w-7 h-7 bg-white/28 rounded-full blur-md pointer-events-none z-15" />

          {/* Priority badge */}
          <span className="absolute top-8 text-xs pointer-events-none select-none z-20">{badge}</span>

          {/* Tooltip */}
          {tooltipOpen && (
            <div
              className="
      pointer-events-auto
      absolute
      left-full
      top-1/2
      ml-4
      -translate-y-1/2
      z-50
      w-[320px]
      max-w-[90vw]
      max-h-[80vh]
      overflow-hidden
      rounded-3xl
      border border-white/60
      bg-white/95
      backdrop-blur-2xl
      shadow-[0_20px_60px_rgba(15,23,42,0.18)]
      text-slate-900
    "
            >
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">

                <h3 className="truncate text-lg font-bold text-slate-900">
                  {task.title}
                </h3>




                <span
                  className={`ml-3 rounded-full px-1 py-1 text-[11px] font-semibold ${task.priority === "High"
                    ? "bg-red-100 text-red-700"
                    : task.priority === "Medium"
                      ? "bg-orange-100 text-orange-700"
                      : "bg-green-100 text-green-700"
                    }`}
                >
                  {task.priority || "Medium"}
                </span>
              </div>

              {/* Body */}
              <div className="max-h-[65vh] overflow-y-auto px-5 py-4">

                {/* Description */}
                {task.description && (
                  <div className="mb-4">
                    <p className="text-sm leading-5 text-slate-700 break-words whitespace-pre-wrap">
                      {task.description}
                    </p>
                  </div>
                )}

                {/* Due Date */}
                <div className="mb-4 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-blue-50 p-3">
                  <div className="flex items-center gap-2">

                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100">
                      📅
                    </div>

                    <div>
                      <p className="text-[10px] uppercase tracking-widest font-bold text-indigo-500">
                        Complete your task by
                      </p>

                      <p className="mt-0.5 text-sm font-semibold text-slate-800">
                        {task.dueDate
                          ? `${formatDate(task.dueDate)} • ${formatTime(task.time)}`
                          : "No due date"}
                      </p>
                    </div>

                  </div>
                </div>

                {/* Subtasks */}
                <div className="mb-4">

                  <div className="mb-3 flex items-center justify-between">

                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Subtasks
                    </h4>

                    {totalSubs > 0 && (
                      <span className="rounded-full bg-indigo-100 px-2 py-1 text-[10px] font-bold text-indigo-700">
                        {doneCount}/{totalSubs}
                      </span>
                    )}

                  </div>

                  <div className="max-h-40 space-y-2 overflow-y-auto pr-1">

                    {subtasks.length > 0 ? (
                      subtasks.map((subtask) => (
                        <button
                          key={subtask.id}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleSubtask?.(task.id, subtask.id);
                          }}
                          className={`group flex w-full items-center gap-3 rounded-2xl border p-3 transition-all duration-300 ${subtask.done
                            ? "border-green-200 bg-green-50"
                            : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50"
                            }`}
                        >
                          <div
                            className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition ${subtask.done
                              ? "border-green-500 bg-green-500 text-white"
                              : "border-slate-300 bg-white group-hover:border-indigo-500"
                              }`}
                          >
                            {subtask.done ? (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-3.5 w-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={3}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            ) : null}
                          </div>

                          <span
                            className={`flex-1 text-left text-sm ${subtask.done
                              ? "line-through text-slate-400"
                              : "text-slate-700"
                              }`}
                          >
                            {subtask.text}
                          </span>

                          <span
                            className={`rounded-full px-2 py-1 text-[10px] font-semibold ${subtask.done
                              ? "bg-green-100 text-green-700"
                              : "bg-slate-100 text-slate-500"
                              }`}
                          >
                            {subtask.done ? "Done" : "Pending"}
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-8 text-center">

                        <div className="mb-2 text-3xl">
                          📝
                        </div>

                        <p className="text-sm font-semibold text-slate-600">
                          No subtasks yet
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Add subtasks to track progress
                        </p>

                      </div>
                    )}

                  </div>

                </div>

                {/* Progress */}
                <div>

                  <div className="mb-2 flex items-center justify-between">

                    <span className="text-sm font-semibold text-slate-700">
                      Progress
                    </span>

                    <span className="text-sm font-bold text-indigo-600">
                      {progress}%
                    </span>

                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-200">

                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />

                  </div>

                </div>

              </div>

              {/* Footer */}

              <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-5 py-3">

                <span className="text-xs text-slate-500">
                  {doneCount}/{totalSubs} Completed
                </span>

                <span className="text-[11px] text-slate-400">
                  Created {formatLongDate(task.createdAt)}
                </span>

              </div>

            </div>
          )}



          {/* Content (Set higher z-index to stay readable over rising water level) */}
          <div className="text-center px-4 mt-1 select-none pointer-events-none flex flex-col items-center justify-center z-20 relative">
            <h2
              className={`
    text-slate-800
    font-extrabold
    tracking-tight
    leading-tight
    drop-shadow-sm
    flex
    items-center
    justify-center
    gap-1
    text-center
    break-words
    ${task.title.length > 35
                  ? "text-[10px]"
                  : task.title.length > 20
                    ? "text-xs"
                    : titleSize
                }
  `}
            >
              {task.isFocused && (
                <span className="text-amber-500">★</span>
              )}

              {task.title}
            </h2>
            <p className={`${timeSize} mt-0.5 font-semibold leading-none ${isUrgent ? "text-red-750 font-bold" : "text-slate-600"}`}>
              {formatTime(task.time)}
            </p>
            <p className="text-[8px] mt-0.5 uppercase tracking-wider text-slate-500/80 font-bold">
              {formatDate(task.dueDate)}
            </p>
            {/* Subtask mini count */}
            {totalSubs > 0 && (
              <div className="mt-1 flex items-center justify-center gap-0.5 bg-white/30 px-1.5 py-0.5 rounded-full border border-white/20 backdrop-blur-xs">
                <span className="text-[8px] font-bold text-slate-600">
                  {doneCount}/{totalSubs}
                </span>
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="rgba(100,120,180,0.8)" strokeWidth="3.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            )}
          </div>

          {/* ── Action Buttons ── */}
          {/* Complete */}
          <button
            onClick={(e) => { e.stopPropagation(); onComplete(task.id); }}
            className="absolute -top-1 -left-1 h-8 w-8 rounded-full bg-white border border-white/60 shadow-md flex items-center justify-center transition-all duration-200 hover:scale-110 hover:bg-emerald-50 text-emerald-500 hover:text-emerald-600 z-20 cursor-pointer"
            title="Mark Complete"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="3" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </button>

          {/* Edit */}
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(task); }}
            className="absolute -top-1 -right-1 h-8 w-8 rounded-full bg-white border border-white/60 shadow-md flex items-center justify-center transition-all duration-200 hover:scale-110 hover:bg-blue-50 text-blue-500 hover:text-blue-600 z-20 cursor-pointer"
            title="Edit Bubble"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M16.862 4.487a2.25 2.25 0 113.182 3.182L8.25 19.463l-4.5 1.318 1.318-4.5L16.862 4.487z" />
            </svg>
          </button>

          {/* Focus Star (Bottom-Left) */}
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFocus(task.id); }}
            className="absolute -bottom-1 -left-1 h-8 w-8 rounded-full bg-white border border-white/60 shadow-md flex items-center justify-center transition-all duration-200 hover:scale-110 hover:bg-amber-50 text-amber-500 z-20 cursor-pointer"
            title={task.isFocused ? "Remove Focus" : "Add to Focus"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill={task.isFocused ? "#f59e0b" : "none"}
              stroke="#f59e0b"
              strokeWidth="2.5"
              className="w-3.5 h-3.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.48 3.499c.195-.39.687-.39.882 0l2.399 4.86c.078.158.23.268.404.293l5.367.78c.43.063.602.587.29.897l-3.885 3.787a.482.482 0 0 0-.138.427l.916 5.344c.074.43-.377.757-.76.554l-4.802-2.527a.482.482 0 0 0-.464 0L6.75 19.33c-.383.203-.834-.124-.76-.554l.916-5.344a.482.482 0 0 0-.138-.427L2.883 9.23c-.311-.31-.139-.834.29-.897l5.367-.78a.482.482 0 0 0 .404-.293l2.399-4.86Z"
              />
            </svg>
          </button>

          {/* Delete (Bottom-Right) */}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
            className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-white border border-white/60 shadow-md flex items-center justify-center transition-all duration-200 hover:scale-110 hover:bg-pink-50 text-pink-500 hover:text-pink-600 z-20 cursor-pointer"
            title="Delete Bubble"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M14.74 9l-.346 9m-4.788 0L9 9m9-4H6m1.5 0V5a1 1 0 011-1h7a1 1 0 011 1v.75M4 9h16" />
            </svg>
          </button>
        </motion.div>
      </motion.div>
    </>
  );
}

export default Bubble;