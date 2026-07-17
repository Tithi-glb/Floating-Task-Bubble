import { useState } from "react";

function Navbar({
  theme,
  setTheme,
  searchQuery,
  setSearchQuery,
  userProfile,
  focusMode,
  setFocusMode,
  notifications,
  setNotifications,
  activeCategory,
  setActiveCategory,
  onLogout,
}) {
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  // Fallback profile
  const profile = userProfile || {
    name: "Guest",
    role: "Viewer",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=guest",
  };

  // Unread notification count
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = (e) => {
    e.stopPropagation();
    if (setNotifications) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  };

  const handleToggleNotif = () => {
    setShowNotifDropdown((v) => !v);
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
      </div>

      {/* Right Side Settings & User Profile */}
      <div className="flex items-center gap-4">
        {/* Focus Mode Button */}
        <button
          onClick={() => setFocusMode(!focusMode)}
          className={`bubble-btn ${theme === "dark"
            ? "bg-slate-800/70 border border-slate-700 text-slate-100 hover:bg-slate-700 hover:text-white"
            : "bg-white/50 border border-white/60 text-slate-600 hover:bg-[#EEF4FF] hover:border-[#4F7CFF]/50 hover:text-[#4F7CFF]"
            }`}
          title="Toggle Focus Mode"
        >
          <span>🎯</span>
          <span>Focus Mode</span>
        </button>

        {/* Settings Button */}
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
          title="Open Settings"
        >
          <span>⚙️</span>
          {/* <span className="hidden sm:inline">Settings</span> */}
        </button>

        <button
          onClick={onLogout}
          className={`bubble-btn ${theme === "dark"
            ? "bg-slate-800/70 border-slate-700 text-slate-100 hover:bg-slate-700 hover:text-white"
            : "bg-white/50 border-white/60 hover:bg-[#f8fafc] hover:border-slate-300 hover:text-slate-700"
            }`}
          title="Log out"
        >
          <span>🔓</span>
          <span className="hidden sm:inline">Logout</span>
        </button>
        <button
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className={`bubble-btn ${theme === "dark"
            ? "bubble-btn-dark"
            : "bubble-btn-light"
            }`}
          title="Toggle Theme"
        >
          <span>{theme === "dark" ? "☀️" : "🌙"}</span>
        </button>

        {/* Notifications Icon with Dropdown */}
        <div className="relative">
          <div
            onClick={handleToggleNotif}
            className={`relative cursor-pointer p-2 rounded-xl transition flex items-center justify-center ${theme === "dark" ? "bg-slate-800/60 hover:bg-slate-700/80" : "hover:bg-white/50"
              }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5 text-slate-600"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
              />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-pink-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center border border-white shadow-sm animate-pulse">
                {unreadCount}
              </span>
            )}
          </div>

          {/* Premium Notifications Dropdown */}
          {showNotifDropdown && (
            <div className={`absolute right-0 mt-3 w-80 backdrop-blur-2xl rounded-2xl shadow-2xl p-4 z-50 animate-fadeIn ${theme === "dark"
              ? "bg-slate-950/95 border border-slate-700"
              : "bg-white/90 border border-slate-200/60"
              }`}>
              <div className={`flex items-center justify-between pb-2.5 mb-2 ${theme === "dark" ? "border-b border-slate-700" : "border-b border-slate-100"
                }`}>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-extrabold text-slate-800">Alerts</span>
                  {unreadCount > 0 && (
                    <span className="bg-pink-500/10 text-pink-600 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                      {unreadCount} New
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[10px] font-extrabold text-[#4F7CFF] hover:underline cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setShowNotifDropdown(false)}
                    className="p-1 rounded-full hover:bg-slate-100/50 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    title="Close Alerts"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-2.5 rounded-xl border transition-all text-xs flex flex-col gap-1 ${notif.read
                      ? "bg-slate-50/50 border-slate-100 text-slate-500"
                      : "bg-red-50/60 border-red-100 text-red-700 font-medium"
                      }`}
                  >
                    <div className="flex justify-between items-start gap-1">
                      <span className="leading-tight">{notif.text}</span>
                      <span className="text-[9px] text-slate-400 font-bold shrink-0">{notif.time}</span>
                    </div>
                  </div>
                ))}

                {notifications.length === 0 && (
                  <div className="text-center py-6 text-slate-400 text-xs flex flex-col items-center gap-1">
                    <span>🫧</span>
                    <span>No notifications yet.</span>
                  </div>
                )}
              </div>
            </div>
          )}
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