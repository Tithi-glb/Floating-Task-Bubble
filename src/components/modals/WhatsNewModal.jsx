import { useEffect } from "react";
import { motion } from "framer-motion";
import Tooltip from "../Tooltip";
import updatesData from "../../data/updates.json";

export default function WhatsNewModal({ onClose, theme }) {
  const isDark = theme === "dark";

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity cursor-pointer" 
        onClick={onClose} 
      />

      {/* Modal Box */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className={`relative w-full max-w-lg p-6 rounded-3xl shadow-2xl border transition-all ${
          isDark 
            ? "bg-slate-900/90 border-slate-800 text-white" 
            : "bg-white/95 border-slate-200 text-slate-800"
        } backdrop-blur-xl flex flex-col max-h-[80vh]`}
      >
        <div className="flex items-center justify-between mb-5 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✨</span>
            <div>
              <h3 className="text-lg font-extrabold leading-6">What's New</h3>
              <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Latest updates and release notes
              </p>
            </div>
          </div>
          <Tooltip content="Close panel">
            <button
              onClick={onClose}
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm cursor-pointer transition ${
                isDark 
                  ? "hover:bg-slate-800 text-slate-400 hover:text-white" 
                  : "hover:bg-slate-100 text-slate-500 hover:text-slate-800"
              }`}
            >
              ✕
            </button>
          </Tooltip>
        </div>

        {/* Scrollable Content */}
        <div 
          className="flex-1 overflow-y-auto pr-1 space-y-6 scrollbar-thin"
          style={{ scrollbarWidth: "none" }}
        >
          {updatesData.map((update) => (
            <div 
              key={update.version} 
              className={`p-4 rounded-2xl border ${
                isDark ? "bg-slate-800/40 border-slate-800" : "bg-slate-50/50 border-slate-100"
              }`}
            >
              <div className="flex items-baseline justify-between gap-2 mb-2">
                <span className="text-sm font-black text-[#4F7CFF]">
                  Version {update.version}
                </span>
                <span className={`text-[10px] font-bold ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                  Released: {update.date}
                </span>
              </div>
              <ul className="space-y-1.5 pl-1.5">
                {update.changes.map((change, cIdx) => (
                  <li key={cIdx} className="flex items-start gap-2 text-xs leading-normal">
                    <span className="text-blue-400 mt-0.5">•</span>
                    <span className={isDark ? "text-slate-300" : "text-slate-600"}>{change}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
