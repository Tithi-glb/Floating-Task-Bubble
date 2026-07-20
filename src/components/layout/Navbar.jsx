import { useState } from "react";
import Tooltip from "../Tooltip";
import { useNotifications } from "../../hooks/useNotifications";
import NotificationPanel from "../NotificationPanel";

function Navbar({
  theme,
  setTheme,
  searchQuery,
  setSearchQuery,
  userProfile,
  focusMode,
  setFocusMode,
  activeCategory,
  setActiveCategory,
  onLogout,
}) {
  const { unreadCount } = useNotifications();
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  // Fallback profile
  const profile = userProfile || {
    name: "Guest",
    role: "Viewer",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=guest",
  };

  return (
    <div className={`h-16 border-b flex items-center justify-between px-6 backdrop-blur-xl z-30 shrink-0 shadow-sm relative ${theme === "dark"
      ? "bg-slate-900/95 text-slate-100 border-slate-700"
      : "bg-white/35 text-slate-800 border-white/40"
      }`}>
      {/* Brand Logo */}
      <div className="flex items-center gap-2">
        <span className="text-3xl filter drop-shadow-sm">🫧</span>
        <h1 className={`text-xl font-bold tracking-tight ${theme === "dark" ? "text-slate-100" : "text-slate-800"}`}>
          Floating<span className="text-[#4F7CFF]">TaskBubble</span>
        </h1>
      </div>

      {/* Center Search Bar */}
      <div className="flex-1 max-w-md mx-8 relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-4 h-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.604 10.604z"
            />
          </svg>
        </div>
        <Tooltip content="Search task bubbles">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search task bubbles..."
            className={`w-full pl-9 pr-4 py-2 text-sm rounded-xl border focus:outline-none focus:border-[#4F7CFF] focus:ring-1 focus:ring-[#4F7CFF]/20 transition-all duration-200 shadow-inner ${theme === "dark"
              ? "bg-slate-800/70 border-slate-700 text-slate-100 placeholder-slate-400 focus:bg-slate-900"
              : "bg-white/40 border-white/50 text-slate-800 placeholder-slate-400 focus:bg-white/70"
              }`}
          />
        </Tooltip>
      </div>

      {/* Right Side Settings & User Profile */}
      <div className="flex items-center gap-4">
        <Tooltip content="Toggle Focus Mode">
          <button
            onClick={() => setFocusMode(!focusMode)}
            className={`bubble-btn ${theme === "dark"
              ? "bg-slate-800/70 border border-slate-700 text-slate-100 hover:bg-slate-700 hover:text-white"
              : "bg-white/50 border border-white/60 text-slate-600 hover:bg-[#EEF4FF] hover:border-[#4F7CFF]/50 hover:text-[#4F7CFF]"
              }`}
          >
            <span>🎯</span>
          </button>
        </Tooltip>

        <Tooltip content="Open Settings">
          <button
            onClick={() => setActiveCategory("Settings")}
            className={`bubble-btn ${activeCategory === "Settings"
              ? theme === "dark"
                ? "bg-slate-800 border-slate-600 text-slate-100"
                : "bg-[#EEF4FF] border-[#4F7CFF] text-[#4F7CFF]"
              : theme === "dark"
                ? "bg-slate-800/70 border-slate-700 text-slate-100 hover:bg-slate-700 hover:border-slate-600 hover:text-white"
                : "bg-white/50 border-white/60 hover:bg-[#EEF4FF] hover:border-[#4F7CFF]/50 hover:text-[#4F7CFF]"
              }`}
          >
            <span>⚙️</span>
            {/* <span className="hidden sm:inline">Settings</span> */}
          </button>
        </Tooltip>

        <Tooltip content="Log out">
          <button
            onClick={onLogout}
            className={`bubble-btn ${theme === "dark"
              ? "bg-slate-800/70 border-slate-700 text-slate-100 hover:bg-slate-700 hover:text-white"
              : "bg-white/50 border-white/60 hover:bg-[#f8fafc] hover:border-slate-300 hover:text-slate-700"
              }`}
          >
            <span>🔓</span>
          </button>
        </Tooltip>
        <Tooltip content="Toggle Light/Dark Theme">
          <button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className={`bubble-btn ${theme === "dark"
              ? "bubble-btn-dark"
              : "bubble-btn-light"
              }`}
          >
            <span>{theme === "dark" ? "☀️" : "🌙"}</span>
          </button>
        </Tooltip>

        {/* Notifications Icon with Dropdown Panel */}
        <div className="relative">
          <Tooltip content="View notifications">
            <button
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              className={`bubble-btn flex items-center justify-center relative focus:outline-none ${
                theme === "dark"
                  ? "bg-slate-800/70 border-slate-700 text-slate-100 hover:bg-slate-700 hover:text-white"
                  : "bg-white/50 border-white/60 text-slate-600 hover:bg-[#EEF4FF] hover:border-[#4F7CFF]/50 hover:text-[#4F7CFF]"
              }`}
            >
              <span>🔔</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center border border-white shadow-sm animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>
          </Tooltip>

          <NotificationPanel 
            isOpen={showNotifDropdown} 
            onClose={() => setShowNotifDropdown(false)} 
            theme={theme} 
          />
        </div>

        {/* Vertical Divider */}
        <div className={`h-6 w-px ${theme === "dark" ? "bg-slate-700" : "bg-slate-200"}`} />

        {/* User Info Details & Avatar */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="text-right hidden md:block">
            <h2 className={`text-xs font-semibold leading-tight ${theme === "dark" ? "text-slate-100" : "text-slate-800"}`}>
              {profile.name}
            </h2>
            <p className={`text-[10px] font-medium ${theme === "dark" ? "text-slate-400" : "text-slate-400"}`}>{profile.role}</p>
          </div>
          <img
            src={profile.avatar}
            alt="Profile Avatar"
            className="w-9 h-9 rounded-full object-cover border border-white shadow-md bg-white"
          />
        </div>
      </div>
    </div>
  );
}

export default Navbar;