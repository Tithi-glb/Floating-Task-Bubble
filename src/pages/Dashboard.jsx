import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import PreviewPanel from "../components/layout/PreviewPanel";
import SettingsPanel from "../components/layout/SettingsPanel";
import AddTaskModal from "../components/modals/AddTaskModal";
import ProgressTracker from "../components/layout/ProgressTracker";
import FloatingDock from "../components/FloatingDock";

import { showNotification } from "../utils/notification";
import { loadTasks, saveTasks, normalizeTask } from "../utils/taskStorage";
import { syncTodaySnapshot } from "../utils/progressStorage";

// ─── Notification chime ───────────────────────────────────────────────────────
const playNotificationSound = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const now = audioCtx.currentTime;
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = "sine"; osc1.frequency.setValueAtTime(587.33, now);
    osc1.connect(gain1); gain1.connect(audioCtx.destination);
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc1.start(now); osc1.stop(now + 0.4);
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = "sine"; osc2.frequency.setValueAtTime(880, now + 0.12);
    osc2.connect(gain2); gain2.connect(audioCtx.destination);
    gain2.gain.setValueAtTime(0.2, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.52);
    osc2.start(now + 0.12); osc2.stop(now + 0.52);
  } catch (e) { /* ignore */ }
};

function Dashboard({ userProfile: propUserProfile, onLogout }) {
  const navigate = useNavigate();
  const isDesktopMode = new URLSearchParams(window.location.search).get("desktop") === "true";

  const fallbackUserProfile = (() => {
    try {
      const s = localStorage.getItem("ftb_user_profile");
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  })();

  const userProfile = propUserProfile || fallbackUserProfile || {
    name: "Guest User",
    role: "Viewer",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=guest",
    email: "guest@bubblespace.io",
  };

  const [tasks, setTasks] = useState(() => loadTasks(userProfile));

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem("bubble_settings");
      return saved ? JSON.parse(saved) : { theme: "light", notificationsEnabled: true, autoOpenNewTask: false, defaultPriority: "Medium" };
    } catch {
      return { theme: "light", notificationsEnabled: true, autoOpenNewTask: false, defaultPriority: "Medium" };
    }
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [focusMode, setFocusMode] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Dashboard");
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [notifications, setNotifications] = useState([]);
  const notifiedTasksRef = useRef(new Set());

  // Persist tasks
  useEffect(() => { saveTasks(tasks, userProfile); }, [tasks]);

  // Sync daily progress snapshot whenever tasks change
  useEffect(() => { syncTodaySnapshot(tasks); }, [tasks]);

  // Persist settings
  useEffect(() => { localStorage.setItem("bubble_settings", JSON.stringify(settings)); }, [settings]);

  // Apply theme
  useEffect(() => {
    if (settings.theme === "dark") {
      document.documentElement.style.backgroundColor = "#020617";
      document.documentElement.style.color = "#f8fafc";
      document.documentElement.style.colorScheme = "dark";
      document.body.style.backgroundColor = "#020617";
      document.body.style.color = "#f8fafc";
    } else {
      document.documentElement.style.backgroundColor = "#f0f4ff";
      document.documentElement.style.color = "#0f172a";
      document.documentElement.style.colorScheme = "light";
      document.body.style.backgroundColor = "#f0f2f8";
      document.body.style.color = "#0f172a";
    }
  }, [settings.theme]);

  // Auth guard
  useEffect(() => {
    if (!propUserProfile && !fallbackUserProfile) navigate("/", { replace: true });
  }, [navigate, propUserProfile, fallbackUserProfile]);

  // Request notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") Notification.requestPermission();
  }, []);

  // Deadline notifications
  useEffect(() => {
    if (!settings.notificationsEnabled) return;
    const check = () => {
      const now = new Date();
      tasks.forEach((task) => {
        if (task.completed || !task.dueDate || !task.time) return;
        const dl = new Date(`${task.dueDate}T${task.time}:00`);
        if (isNaN(dl)) return;
        const diff = dl - now;
        const oneHour = 60 * 60 * 1000;
        if (diff > 0 && diff <= oneHour && !notifiedTasksRef.current.has(task.id)) {
          notifiedTasksRef.current.add(task.id);
          playNotificationSound();
          const timeLabel = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          setNotifications((prev) => [
            { id: Date.now() + task.id, text: `⏳ "${task.title}" is due in less than 1 hour!`, time: timeLabel, read: false },
            ...prev,
          ]);
          showNotification(task);
        }
      });
    };
    check();
    const id = setInterval(check, 10000);
    return () => clearInterval(id);
  }, [tasks, settings.notificationsEnabled]);

  // ─── Task CRUD ──────────────────────────────────────────────────────────────

  const addTask = (newTask) => {
    setTasks((prev) => [
      ...prev,
      {
        id: Date.now(),
        completed: false,
        isFocused: newTask.isFocused || false,
        subtasks: [],
        priority: newTask.priority || settings.defaultPriority,
        ...newTask,
      },
    ]);
    setIsModalOpen(false);
  };

  const updateTask = (updatedTask) => {
    setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? { ...t, ...updatedTask } : t)));
    setIsModalOpen(false);
    setEditingTask(null);
  };

  // Inline update from bubble toolbar (partial patch by id)
  const updateTaskById = (taskId, patch) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...patch } : t)));
  };

  const deleteTask = (taskId) => {
    const deleted = tasks.find((t) => t.id === taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (deleted) setNotifications((prev) => prev.filter((n) => !n.text.includes(deleted.title)));
    notifiedTasksRef.current.delete(taskId);
  };

  const toggleTaskCompletion = (taskId) => {
    const today = new Date().toISOString().split("T")[0];
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, completed: !t.completed, completedDate: !t.completed ? today : undefined }
          : t
      )
    );
  };

  const toggleFocus = (taskId) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, isFocused: !t.isFocused } : t)));
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleSaveSettings = (newSettings) => setSettings(newSettings);

  const handleLogout = () => {
    if (onLogout) onLogout();
    navigate("/");
  };

  // ─── Filtering ──────────────────────────────────────────────────────────────

  const filteredTasks = tasks.filter((t) => {
    if (t.completed) return false;
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    const today = new Date().toISOString().split("T")[0];

    if (activeCategory === "Dashboard") return t.dueDate === today;
    if (activeCategory === "Calendar") return t.dueDate === selectedDate;
    if (activeCategory === "Focus Tasks") return t.dueDate === selectedDate && t.isFocused;
    if (activeCategory === "My Tasks") return true;
    if (activeCategory === "Priority Queue") {
      if (t.dueDate !== today) return false;
      if (priorityFilter !== "all") return t.priority.toLowerCase() === priorityFilter.toLowerCase();
      return true;
    }
    return true;
  });

  // ─── Open progress from dock icon click inside bubble toolbar ───────────────
  const handleOpenProgress = () => setActiveCategory("Progress Tracker");

  const appBg = settings.theme === "dark"
    ? "bg-slate-950 text-slate-100"
    : "bg-gradient-to-br from-[#F0F4FF] via-white to-[#F5ECFF] text-[#0F172A]";

  return (
    <div className={`h-screen w-screen flex flex-col font-sans select-none overflow-hidden ${isDesktopMode ? "bg-transparent text-[#0F172A]" : appBg}`}>

      {/* Navbar */}
      {!focusMode && !isDesktopMode && (
        <Navbar
          theme={settings.theme}
          setTheme={(t) => setSettings((prev) => ({ ...prev, theme: t }))}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          userProfile={userProfile}
          focusMode={focusMode}
          setFocusMode={setFocusMode}
          notifications={notifications}
          setNotifications={setNotifications}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          onLogout={handleLogout}
        />
      )}

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {!focusMode && !isDesktopMode && (
          <Sidebar
            theme={settings.theme}
            tasks={tasks}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            priorityFilter={priorityFilter}
            setPriorityFilter={setPriorityFilter}
            onAddTask={() => setIsModalOpen(true)}
          />
        )}

        <div className="flex-grow flex flex-col relative overflow-hidden h-full">
          {activeCategory === "Settings" ? (
            <SettingsPanel
              theme={settings.theme}
              settings={settings}
              onSave={handleSaveSettings}
              userProfile={userProfile}
              onLogout={handleLogout}
            />
          ) : activeCategory === "Progress Tracker" ? (
            <ProgressTracker
              tasks={tasks}
              theme={settings.theme}
              onClose={() => setActiveCategory("Dashboard")}
            />
          ) : (
            <PreviewPanel
              theme={settings.theme}
              tasks={filteredTasks}
              isDesktopMode={isDesktopMode}
              allTasks={tasks}
              activeCategory={activeCategory}
              isModalOpen={isModalOpen}
              focusMode={focusMode}
              setFocusMode={setFocusMode}
              onEdit={handleEdit}
              onDelete={deleteTask}
              onComplete={toggleTaskCompletion}
              onToggleFocus={toggleFocus}
              onUpdateTask={updateTaskById}
              onAddTask={() => setIsModalOpen(true)}
              onOpenProgress={handleOpenProgress}
            />
          )}

          {/* Floating Dock — always visible at bottom of active workspace */}
          <FloatingDock
            tasks={tasks}
            theme={settings.theme}
            onAddTask={() => setIsModalOpen(true)}
            onUpdateTask={updateTaskById}
            onComplete={toggleTaskCompletion}
            onEdit={handleEdit}
            onDelete={deleteTask}
          />
        </div>
      </div>

      {/* Add Task Modal */}
      {isModalOpen && (
        <AddTaskModal
          onClose={() => { setIsModalOpen(false); setEditingTask(null); }}
          onCreate={editingTask ? updateTask : addTask}
          editingTask={editingTask}
          defaultPriority={settings.defaultPriority}
        />
      )}
    </div>
  );
}

export default Dashboard;