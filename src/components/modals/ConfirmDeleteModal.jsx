import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Tooltip from "../Tooltip";

export default function ConfirmDeleteModal({ task, onConfirm, onCancel, theme }) {
  const isDark = theme === "dark";
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = useCallback(() => {
    if (isDeleting) return;
    setIsDeleting(true);
    onConfirm();
  }, [isDeleting, onConfirm]);

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleConfirm();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [handleConfirm, onCancel]);

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity cursor-pointer" 
        onClick={onCancel} 
      />

      {/* Modal Box */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className={`relative w-full max-w-md p-6 rounded-3xl shadow-2xl border transition-all ${
          isDark 
            ? "bg-slate-900/90 border-slate-800 text-white" 
            : "bg-white/95 border-slate-250 text-slate-800"
        } backdrop-blur-xl`}
      >
        <div className="flex items-center gap-3.5 mb-4">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 text-xl font-bold shrink-0">
            ⚠️
          </div>
          <div>
            <h3 className="text-lg font-extrabold leading-6">Delete Floating Task?</h3>
            <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              This action cannot be undone.
            </p>
          </div>
        </div>

        <div className={`p-4 rounded-2xl mb-6 text-sm font-semibold border ${
          isDark 
            ? "bg-slate-950/40 border-slate-800/80 text-slate-350" 
            : "bg-slate-50/50 border-slate-100 text-slate-600"
        }`}>
          "{task.title}"
        </div>

        <div className="flex gap-3 justify-end">
          <Tooltip content="Dismiss dialog">
            <button
              onClick={onCancel}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs cursor-pointer transition-all ${
                isDark 
                  ? "bg-slate-800 hover:bg-slate-700 text-slate-300" 
                  : "bg-slate-100 hover:bg-slate-200 text-slate-600"
              }`}
            >
              Cancel
            </button>
          </Tooltip>
          <Tooltip content="Delete task permanently">
            <button
              onClick={handleConfirm}
              className="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs cursor-pointer transition-all shadow-md shadow-red-500/15"
            >
              Delete
            </button>
          </Tooltip>
        </div>
      </motion.div>
    </div>
  );
}
