import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

export default function Tooltip({ content, children, className = "", ...props }) {
  const [hovered, setHovered] = useState(false);
  const [position, setPosition] = useState("top");
  const [targetRect, setTargetRect] = useState(null);
  const targetRef = useRef(null);

  useEffect(() => {
    if (!hovered || !targetRef.current) {
      setTargetRect(null);
      return;
    }

    const updatePosition = () => {
      if (!targetRef.current) return;
      const rect = targetRef.current.getBoundingClientRect();
      setTargetRect(rect);

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      const distToTop = rect.top;
      const distToBottom = viewportHeight - rect.bottom;
      const distToLeft = rect.left;
      const distToRight = viewportWidth - rect.right;

      const minDist = Math.min(distToTop, distToBottom, distToLeft, distToRight);

      let bestSide = "top";
      if (minDist === distToTop) {
        bestSide = "bottom";
      } else if (minDist === distToBottom) {
        bestSide = "top";
      } else if (minDist === distToLeft) {
        bestSide = "right";
      } else if (minDist === distToRight) {
        bestSide = "left";
      }

      setPosition(bestSide);
    };

    updatePosition();

    // Listen to all scrolls (capturing) and window resize to update positioning
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [hovered]);

  const caretClasses = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-[6px] border-t-slate-900 border-x-transparent border-x-[6px]",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-[6px] border-b-slate-900 border-x-transparent border-x-[6px]",
    left: "left-full top-1/2 -translate-y-1/2 border-l-[6px] border-l-slate-900 border-y-transparent border-y-[6px]",
    right: "right-full top-1/2 -translate-y-1/2 border-r-[6px] border-r-slate-900 border-y-transparent border-y-[6px]",
  };

  let top = 0;
  let left = 0;
  let transform = "";

  if (targetRect) {
    if (position === "top") {
      top = targetRect.top - 8;
      left = targetRect.left + targetRect.width / 2;
      transform = "translate(-50%, -100%)";
    } else if (position === "bottom") {
      top = targetRect.bottom + 8;
      left = targetRect.left + targetRect.width / 2;
      transform = "translate(-50%, 0)";
    } else if (position === "left") {
      top = targetRect.top + targetRect.height / 2;
      left = targetRect.left - 8;
      transform = "translate(-100%, -50%)";
    } else if (position === "right") {
      top = targetRect.top + targetRect.height / 2;
      left = targetRect.right + 8;
      transform = "translate(0, -50%)";
    }
  }

  return (
    <div
      ref={targetRef}
      className={`relative inline-flex items-center justify-center ${className}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      {...props}
    >
      {children}
      {createPortal(
        <AnimatePresence>
          {hovered && content && targetRect && (
            <div
              style={{
                position: "fixed",
                top: `${top}px`,
                left: `${left}px`,
                transform,
                zIndex: 99999,
                pointerEvents: "none",
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.12 }}
                className="relative px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-white whitespace-nowrap"
                style={{
                  background: "rgba(15, 23, 42, 0.92)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
                }}
              >
                {content}
                <div className={`absolute w-0 h-0 ${caretClasses[position]}`} />
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
