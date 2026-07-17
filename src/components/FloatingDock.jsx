import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DockIcon from "./DockIcon";
import CalendarPanel from "./CalendarPanel";
import ProgressPanel from "./ProgressPanel";
import PendingTasksPanel from "./PendingTasksPanel";
import CompletedTasksPanel from "./CompletedTasksPanel";

const DOCK_ITEMS = [
  { key: "calendar",   icon: "📅", label: "Calendar" },
  { key: "progress",   icon: "📈", label: "Today's Progress" },
  { key: "addtask",    icon: "➕", label: "Add Task" },
  { key: "pending",    icon: "📝", label: "Pending Tasks" },
  { key: "completed",  icon: "✅", label: "Completed Tasks" },
];

/**
 * FloatingDock — macOS-inspired glassmorphism dock fixed at bottom-center.
 *
 * Props:
 *  tasks        — all tasks array
 *  theme        — "light" | "dark"
 *  onAddTask    — fn() opens add task modal
 *  onUpdateTask — fn(id, patch)
 *  onComplete   — fn(id)
 *  onEdit       — fn(task)
 *  onDelete     — fn(id)
 */
export default function FloatingDock({ tasks, theme, onAddTask, onUpdateTask, onComplete, onEdit, onDelete }) {
  const [activePanel, setActivePanel] = useState(null); // key or null
  const [mouseX, setMouseX] = useState(null);
  const dockRef = useRef(null);
  const iconRefs = useRef([]);

  // Track mouse X relative to dock for magnification
  const handleMouseMove = useCallback((e) => {
    if (dockRef.current) {
      const rect = dockRef.current.getBoundingClientRect();
      setMouseX(e.clientX - rect.left);
    }
  }, []);

  const handleMouseLeave = useCallback(() => setMouseX(null), []);

  // Click outside to close panels
  useEffect(() => {
    if (!activePanel) return;
    const handleClick = (e) => {
      if (dockRef.current && !dockRef.current.contains(e.target)) {
        // Check if the click is inside any open panel
        const panels = document.querySelectorAll("[data-dock-panel]");
        for (const p of panels) {
          if (p.contains(e.target)) return;
        }
        setActivePanel(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [activePanel]);

  const handleIconClick = (key) => {
    if (key === "addtask") {
      onAddTask();
      setActivePanel(null);
      return;
    }
    setActivePanel((prev) => (prev === key ? null : key));
  };

  // Compute each icon's center X position for magnification
  const getIconCenterX = (index) => {
    const ref = iconRefs.current[index];
    if (!ref || !dockRef.current) return 0;
    const dockRect = dockRef.current.getBoundingClientRect();
    const iconRect = ref.getBoundingClientRect();
    return iconRect.left - dockRect.left + iconRect.width / 2;
  };

  const isDark = theme === "dark";

  // Dock glass style
  const dockStyle = {
    background: isDark
      ? "rgba(15, 23, 42, 0.75)"
      : "rgba(255, 255, 255, 0.55)",
    backdropFilter: "blur(28px) saturate(180%)",
    WebkitBackdropFilter: "blur(28px) saturate(180%)",
    border: isDark
      ? "1px solid rgba(255, 255, 255, 0.08)"
      : "1px solid rgba(255, 255, 255, 0.65)",
    boxShadow: isDark
      ? "0 -4px 40px rgba(0,0,0,0.5), 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)"
      : "0 -4px 40px rgba(79,124,255,0.08), 0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.9)",
  };

  return (
    <>
      {/* Panel overlay — rendered below dock */}
      <AnimatePresence>
        {activePanel && activePanel !== "addtask" && (
          <motion.div
            key={activePanel}
            data-dock-panel="true"
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[998]"
            style={{ maxWidth: "min(680px, calc(100vw - 48px))", width: "100%" }}
          >
            <div
              className="rounded-3xl overflow-hidden shadow-2xl"
              style={{
                background: isDark ? "rgba(15, 23, 42, 0.96)" : "rgba(255,255,255,0.96)",
                backdropFilter: "blur(32px) saturate(200%)",
                WebkitBackdropFilter: "blur(32px) saturate(200%)",
                border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid rgba(200,215,255,0.5)",
                boxShadow: "0 24px 80px rgba(0,0,0,0.25), 0 4px 24px rgba(0,0,0,0.1)",
                maxHeight: "70vh",
                overflowY: "auto",
              }}
            >
              {/* Panel header */}
              <div className={`flex items-center justify-between px-5 pt-5 pb-3 ${isDark ? "border-b border-slate-800" : "border-b border-slate-100"}`}>
                <h2 className={`text-lg font-extrabold flex items-center gap-2 ${isDark ? "text-white" : "text-slate-800"}`}>
                  {DOCK_ITEMS.find((d) => d.key === activePanel)?.icon}{" "}
                  {DOCK_ITEMS.find((d) => d.key === activePanel)?.label}
                </h2>
                <button
                  onClick={() => setActivePanel(null)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm cursor-pointer transition-all ${isDark ? "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white" : "bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500"}`}
                >
                  ✕
                </button>
              </div>

              {/* Panel content */}
              <div className="p-5">
                {activePanel === "calendar" && (
                  <CalendarPanel tasks={tasks} theme={theme} onClose={() => setActivePanel(null)} />
                )}
                {activePanel === "progress" && (
                  <ProgressPanel tasks={tasks} theme={theme} onClose={() => setActivePanel(null)} />
                )}
                {activePanel === "pending" && (
                  <PendingTasksPanel tasks={tasks} theme={theme} onComplete={onComplete} onEdit={onEdit} />
                )}
                {activePanel === "completed" && (
                  <CompletedTasksPanel tasks={tasks} theme={theme} />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dock bar */}
      <div className="absolute bottom-5 left-0 right-0 flex justify-center z-[999] pointer-events-none">
        <motion.div
          ref={dockRef}
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 28, delay: 0.3 }}
          className="flex items-end px-4 py-2 rounded-[28px] pointer-events-auto"
          style={dockStyle}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {DOCK_ITEMS.map((item, index) => (
            <div
              key={item.key}
              ref={(el) => (iconRefs.current[index] = el)}
            >
              <DockIcon
                icon={item.icon}
                label={item.label}
                isActive={activePanel === item.key}
                mouseX={mouseX}
                selfX={getIconCenterX(index)}
                baseSize={52}
                onClick={() => handleIconClick(item.key)}
              />
            </div>
          ))}
        </motion.div>
      </div>
    </>
  );
}
