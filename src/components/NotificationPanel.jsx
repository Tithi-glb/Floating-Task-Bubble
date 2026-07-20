import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNotifications } from "../hooks/useNotifications";
import Tooltip from "./Tooltip";

export default function NotificationPanel({ isOpen, onClose, theme }) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll, permission, requestPermission } = useNotifications();

  if (!isOpen) return null;

  return (
    <div 
      className={`absolute right-0 mt-3 w-80 backdrop-blur-2xl rounded-2xl shadow-2xl p-4 z-50 overflow-hidden ${
        theme === "dark"
          ? "bg-slate-950/95 border border-slate-800 text-slate-100"
          : "bg-white/90 border border-slate-200/60 text-slate-800"
      }`}
      style={{ minWidth: "320px" }}
    >
      {/* Header */}
      <div className={`flex items-center justify-between pb-3 mb-3 border-b ${
        theme === "dark" ? "border-slate-800" : "border-slate-100"
      }`}>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-extrabold">Alerts</span>
          {unreadCount > 0 && (
            <span className="bg-blue-500/10 text-blue-500 text-[10px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
              {unreadCount} New
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Tooltip content="Mark all read">
              <button
                onClick={markAllAsRead}
                className="text-[10px] font-bold text-blue-500 hover:underline cursor-pointer bg-transparent border-none focus:outline-none"
              >
                Mark all read
              </button>
            </Tooltip>
          )}
          {notifications.length > 0 && (
            <Tooltip content="Clear history">
              <button
                onClick={clearAll}
                className="text-[10px] font-bold text-red-500 hover:underline cursor-pointer bg-transparent border-none focus:outline-none"
              >
                Clear
              </button>
            </Tooltip>
          )}
          <Tooltip content="Close alerts">
            <button
              onClick={onClose}
              className={`p-1 rounded-full transition-colors cursor-pointer focus:outline-none ${
                theme === "dark" ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Permission warning */}
      {permission !== "granted" && (
        <div className={`p-2.5 mb-3 rounded-xl text-[10px] flex items-center justify-between gap-2 border ${
          theme === "dark" 
            ? "bg-amber-500/10 text-amber-400 border-amber-500/20" 
            : "bg-amber-50 border-amber-200 text-amber-700"
        }`}>
          <span>Desktop alerts are disabled.</span>
          <button 
            onClick={requestPermission}
            className="px-2 py-0.5 rounded bg-amber-500 text-white font-bold hover:bg-amber-600 transition text-[9px] cursor-pointer focus:outline-none"
          >
            Enable
          </button>
        </div>
      )}

      {/* Notification history list */}
      <div className="max-h-60 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
        <AnimatePresence initial={false}>
          {notifications.map((notif) => {
            let typeColor = "";
            let typeIcon = "🔔";
            if (notif.type === "completed") {
              typeColor = "border-emerald-500/30 bg-emerald-500/5";
              typeIcon = "🎉";
            } else if (notif.type === "overdue") {
              typeColor = "border-red-500/30 bg-red-500/5";
              typeIcon = "⚠️";
            } else if (notif.type === "dueSoon") {
              typeColor = "border-amber-500/30 bg-amber-500/5";
              typeIcon = "⏳";
            } else {
              typeColor = "border-blue-500/30 bg-blue-500/5";
              typeIcon = "🔔";
            }

            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onClick={() => markAsRead(notif.id)}
                className={`p-2.5 rounded-xl border text-xs flex flex-col gap-1 transition-all cursor-pointer relative group ${
                  notif.read
                    ? theme === "dark"
                      ? "bg-slate-900/40 border-slate-800/80 text-slate-500"
                      : "bg-slate-50/50 border-slate-100/60 text-slate-400"
                    : `${typeColor} font-medium`
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex gap-2 items-start">
                    <span className="text-sm shrink-0">{typeIcon}</span>
                    <span className="leading-snug">{notif.text}</span>
                  </div>
                  <span className="text-[9px] text-slate-400 font-semibold shrink-0 mt-0.5">{notif.time}</span>
                </div>
                {notif.taskPriority && !notif.read && (
                  <div className="flex gap-1.5 mt-1.5 ml-7">
                    <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold border ${
                      theme === "dark" 
                        ? "bg-slate-800 text-slate-400 border-slate-700" 
                        : "bg-slate-100 text-slate-500 border-slate-200"
                    }`}>
                      {notif.taskPriority} Priority
                    </span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {notifications.length === 0 && (
          <div className="text-center py-6 text-slate-400 text-xs flex flex-col items-center gap-1.5">
            <span className="text-2xl">🫧</span>
            <span>No alerts yet.</span>
          </div>
        )}
      </div>
    </div>
  );
}
