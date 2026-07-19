import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Toast({ toast, onRemove }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const typeStyles = {
    success: "bg-emerald-50/90 border-emerald-200 text-emerald-800 dark:bg-emerald-950/90 dark:border-emerald-900 dark:text-emerald-300",
    info: "bg-sky-50/90 border-sky-200 text-sky-800 dark:bg-sky-950/90 dark:border-sky-900 dark:text-sky-300",
    warning: "bg-amber-50/90 border-amber-200 text-amber-800 dark:bg-amber-950/90 dark:border-amber-900 dark:text-amber-300",
    error: "bg-red-50/90 border-red-200 text-red-800 dark:bg-red-950/90 dark:border-red-900 dark:text-red-300",
  };

  const icons = {
    success: "✅",
    info: "ℹ️",
    warning: "⏳",
    error: "🔔",
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
      className={`flex items-center justify-between p-4 rounded-2xl border shadow-lg backdrop-blur-md pointer-events-auto max-w-sm w-80 text-sm font-semibold transition-all ${typeStyles[toast.type] || typeStyles.info}`}
    >
      <div className="flex items-center gap-3">
        <span className="text-base">{icons[toast.type] || "🔔"}</span>
        <span className="leading-snug">{toast.message}</span>
      </div>
      
      <div className="flex items-center gap-2 shrink-0 ml-3">
        {toast.action && (
          <button
            onClick={() => {
              toast.action.onClick();
              onRemove(toast.id);
            }}
            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-800 text-white hover:bg-slate-900 transition dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 cursor-pointer"
          >
            {toast.action.label}
          </button>
        )}
        <button
          onClick={() => onRemove(toast.id)}
          className="text-slate-400 hover:text-slate-600 transition cursor-pointer text-xs font-bold px-1"
        >
          ✕
        </button>
      </div>
    </motion.div>
  );
}

export function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2.5 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onRemove={onRemove} />
        ))}
      </AnimatePresence>
    </div>
  );
}
