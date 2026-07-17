import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * DockIcon — A single macOS-style dock icon with magnification,
 * tooltip, lift animation, glow, and active indicator dot.
 *
 * Props:
 *  icon         — emoji / string
 *  label        — tooltip text
 *  isActive     — bool (shows indicator dot + glow)
 *  mouseX       — current mouse X relative to dock (for magnification)
 *  selfX        — this icon's center X relative to dock
 *  baseSize     — base icon size in px
 *  onClick      — fn()
 */
export default function DockIcon({ icon, label, isActive, mouseX, selfX, baseSize = 52, onClick }) {
  const [hovered, setHovered] = useState(false);

  // macOS magnification: size scales based on distance from cursor
  const distance = mouseX !== null ? Math.abs(mouseX - selfX) : 999;
  const maxDist = 90;
  const magnify = mouseX !== null && distance < maxDist
    ? baseSize + (baseSize * 0.65) * Math.max(0, 1 - distance / maxDist)
    : baseSize;
  const neighborLift = mouseX !== null && distance < maxDist * 1.6
    ? Math.max(0, 1 - distance / (maxDist * 1.6)) * 18
    : 0;

  return (
    <div
      className="relative flex flex-col items-center justify-end"
      style={{ width: baseSize + 20, paddingBottom: 4 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Tooltip */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.88 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.92 }}
            transition={{ duration: 0.14, ease: "easeOut" }}
            className="absolute bottom-full mb-3 px-3 py-1.5 rounded-xl text-xs font-semibold text-white whitespace-nowrap pointer-events-none z-50"
            style={{
              background: "rgba(15, 23, 42, 0.88)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
            }}
          >
            {label}
            {/* Caret */}
            <div
              className="absolute left-1/2 -translate-x-1/2 top-full w-2 h-1.5"
              style={{
                borderLeft: "6px solid transparent",
                borderRight: "6px solid transparent",
                borderTop: "6px solid rgba(15, 23, 42, 0.88)",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Icon button */}
      <motion.button
        onClick={onClick}
        animate={{
          width: magnify,
          height: magnify,
          y: -neighborLift,
        }}
        transition={{ type: "spring", stiffness: 320, damping: 24, mass: 0.7 }}
        whileTap={{ scale: 0.88, y: 2 }}
        className="relative flex items-center justify-center rounded-2xl cursor-pointer select-none outline-none border-0"
        style={{
          background: isActive
            ? "rgba(79, 124, 255, 0.22)"
            : hovered
              ? "rgba(255, 255, 255, 0.18)"
              : "rgba(255, 255, 255, 0.08)",
          boxShadow: isActive
            ? `0 0 18px rgba(79,124,255,0.45), 0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2)`
            : hovered
              ? `0 0 12px rgba(255,255,255,0.15), 0 4px 16px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.2)`
              : `0 2px 8px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.1)`,
          border: isActive
            ? "1.5px solid rgba(79, 124, 255, 0.5)"
            : "1.5px solid rgba(255, 255, 255, 0.12)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          transition: "background 0.2s, box-shadow 0.2s, border-color 0.2s",
        }}
      >
        <motion.span
          animate={{ scale: hovered ? 1.08 : 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 18 }}
          style={{ fontSize: magnify * 0.5, lineHeight: 1 }}
          className="pointer-events-none"
        >
          {icon}
        </motion.span>
      </motion.button>

      {/* Active indicator dot */}
      <div className="h-1.5 flex items-center justify-center mt-1">
        <AnimatePresence>
          {isActive && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="w-1.5 h-1.5 rounded-full bg-white"
              style={{ boxShadow: "0 0 6px rgba(255,255,255,0.8)" }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
