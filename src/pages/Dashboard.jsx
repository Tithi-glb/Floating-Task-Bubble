import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import PreviewPanel from "../components/layout/PreviewPanel";
import SettingsPanel from "../components/layout/SettingsPanel";
import AddTaskModal from "../components/modals/AddTaskModal";
import ProgressTracker from "../components/layout/ProgressTracker";
import FloatingDock from "../components/FloatingDock";
import { ToastContainer } from "../components/Toast";
import ConfirmDeleteModal from "../components/modals/ConfirmDeleteModal";
import FloatingTaskListBubble from "../components/FloatingTaskListBubble";
import WhatsNewModal from "../components/modals/WhatsNewModal";
import FeaturesModal from "../components/modals/FeaturesModal";

import { loadTasks, saveTasks } from "../utils/taskStorage";
import { syncTodaySnapshot } from "../utils/progressStorage";

function formatDate(dateStr) {
  if (!dateStr) return "";
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  d.setHours(0, 0, 0, 0);
  if (d.getTime() === today.getTime()) return "Today";
  if (d.getTime() === tomorrow.getTime()) return "Tomorrow";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatTime(timeStr) {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12}:${m} ${ampm}`;
}

function parseLocalDateTime(dateStr, timeStr) {
  if (!dateStr) return new Date(NaN);
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hour, minute] = (timeStr || "00:00").split(":").map(Number);
  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

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
  } catch { /* ignore */ }
};

const generateId = () => Date.now();

function Dashboard({ userProfile: propUserProfile, onLogout }) {
  const navigate = useNavigate();
  const isDesktopMode = new URLSearchParams(window.location.search).get("desktop") === "true";

  const fallbackUserProfile = useMemo(() => {
    try {
      const s = localStorage.getItem("ftb_user_profile");
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  }, []);

  const userProfile = useMemo(() => propUserProfile || fallbackUserProfile || {
    name: "Guest User",
    role: "Viewer",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=guest",
    email: "guest@bubblespace.io",
  }, [propUserProfile, fallbackUserProfile]);

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
  const lastNotifiedTimesRef = useRef(new Map());
  const [toasts, setToasts] = useState([]);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [isWhatsNewOpen, setIsWhatsNewOpen] = useState(false);
  const [isFeaturesOpen, setIsFeaturesOpen] = useState(false);

  const addToast = (message, type = "info", action = null) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type, action }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleDeleteRequest = (taskId) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      setTaskToDelete(task);
    }
  };

  // Persist tasks
  useEffect(() => { saveTasks(tasks, userProfile); }, [tasks, userProfile]);



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
    if ("Notification" in window) {
      const ask = () => {
        if (Notification.permission === "default") {
          try {
            const result = Notification.requestPermission((perm) => {
              console.log("Notification permission via callback:", perm);
            });
            if (result && typeof result.then === "function") {
              result.then((perm) => {
                console.log("Notification permission via promise:", perm);
              });
            }
          } catch (e) {
            console.error("Error requesting notification permission:", e);
          }
        }
      };
      ask();
      window.addEventListener("click", ask, { once: true });
      return () => window.removeEventListener("click", ask);
    }
  }, []);

  // Deadline notifications
  useEffect(() => {
    if (!settings.notificationsEnabled) return;
    const check = () => {
      const now = new Date();
      tasks.forEach((task) => {
        if (task.completed || !task.dueDate || !task.time) return;
        const dl = parseLocalDateTime(task.dueDate, task.time);
        if (isNaN(dl.getTime())) return;

        const hasCustomReminder = !!(task.reminderDate && task.reminderTime);
        const reminderDateTime = hasCustomReminder
          ? parseLocalDateTime(task.reminderDate, task.reminderTime)
          : new Date(dl.getTime() - 60 * 60 * 1000);

        if (isNaN(reminderDateTime.getTime())) return;

        if (now >= reminderDateTime) {
          const lastNotified = lastNotifiedTimesRef.current.get(task.id);
          const fifteenMinutes = 15 * 60 * 1000;

          if (!lastNotified || (now.getTime() - lastNotified >= fifteenMinutes)) {
            lastNotifiedTimesRef.current.set(task.id, now.getTime());
            playNotificationSound();
            const timeLabel = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

            const text = hasCustomReminder
              ? `🔔 Reminder: "${task.title}" is due at ${task.time}!`
              : `⏳ "${task.title}" is due in less than 1 hour!`;

            setNotifications((prev) => [
              { id: Date.now() + task.id, text, time: timeLabel, read: false },
              ...prev,
            ]);

            console.log("Attempting to trigger desktop notification for task:", task.title, "Permission:", Notification.permission);
            if ("Notification" in window && Notification.permission === "granted") {
              try {
                const dueText = `Due ${formatDate(task.dueDate)} • ${formatTime(task.time)}`;
                const priorityText = task.priority ? `\nPriority: ${task.priority}` : "";
                const n = new Notification("Reminder", {
                  body: `${task.title}\n${dueText}${priorityText}`,
                });
                n.onclick = () => {
                  window.focus();
                };
                console.log("Desktop notification triggered successfully.");
              } catch (err) {
                console.error("Failed to construct Notification object:", err);
              }
            } else {
              console.log("Notification not allowed or API not supported. Permission status:", Notification.permission);
            }

            addToast(text, hasCustomReminder ? "error" : "warning");
          }
        }
      });
    };
    check();
    const id = setInterval(check, 10000);
    return () => clearInterval(id);
  }, [tasks, settings.notificationsEnabled]);

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.defaultPrevented) return;
      if (e.key === "Escape") {
        if (activeCategory !== "Dashboard") {
          e.preventDefault();
          setActiveCategory("Dashboard");
        }
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [activeCategory]);

  // ─── Task CRUD ──────────────────────────────────────────────────────────────

  const addTask = (newTask) => {
    const createdTask = {
      id: generateId(),
      completed: false,
      isFocused: newTask.isFocused || false,
      subtasks: [],
      priority: newTask.priority || settings.defaultPriority,
      ...newTask,
    };
    setTasks((prev) => [
      ...prev,
      createdTask,
    ]);
    setIsModalOpen(false);
    localStorage.removeItem("ftb_task_draft");

    addToast(`Task "${createdTask.title}" created.`, "success", {
      label: "Edit",
      onClick: () => handleEdit(createdTask),
    });
  };

  const updateTask = (updatedTask) => {
    // Clear notification ref if reminder date/time or deadline has changed, so it can fire again
    const hasReminderChanged =
      updatedTask.reminderDate !== editingTask?.reminderDate ||
      updatedTask.reminderTime !== editingTask?.reminderTime ||
      updatedTask.dueDate !== editingTask?.dueDate ||
      updatedTask.time !== editingTask?.time;

    if (hasReminderChanged && editingTask) {
      notifiedTasksRef.current.delete(editingTask.id);
      lastNotifiedTimesRef.current.delete(editingTask.id);
    }

    setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? { ...t, ...updatedTask } : t)));
    setIsModalOpen(false);
    setEditingTask(null);
    localStorage.removeItem("ftb_task_draft");

    addToast(`Task "${updatedTask.title}" updated.`, "info");
  };

  // Inline update from bubble toolbar (partial patch by id)
  const updateTaskById = (taskId, patch) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...patch } : t)));
  };

  const deleteTask = (taskId) => {
    const deleted = tasks.find((t) => t.id === taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (deleted) {
      setNotifications((prev) => prev.filter((n) => !n.text.includes(deleted.title)));
      addToast(`Task "${deleted.title}" deleted.`, "warning");
    }
    notifiedTasksRef.current.delete(taskId);
    lastNotifiedTimesRef.current.delete(taskId);
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
    const savedDraft = localStorage.getItem("ftb_task_draft");
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        if (draft.isEdit && draft.editingTaskId === task.id) {
          setEditingTask({ ...task, ...draft, isDraft: true });
          setIsModalOpen(true);
          return;
        }
      } catch {
        localStorage.removeItem("ftb_task_draft");
      }
    }
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleOpenAddTask = () => {
    const savedDraft = localStorage.getItem("ftb_task_draft");
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        if (draft.isEdit && draft.editingTaskId) {
          const taskToEdit = tasks.find((t) => t.id === draft.editingTaskId);
          if (taskToEdit) {
            setEditingTask({ ...taskToEdit, ...draft, isDraft: true });
          } else {
            setEditingTask({ isDraft: true, ...draft });
          }
        } else {
          setEditingTask({ isDraft: true, ...draft });
        }
        setIsModalOpen(true);
      } catch {
        localStorage.removeItem("ftb_task_draft");
        setEditingTask(null);
        setIsModalOpen(true);
      }
    } else {
      setEditingTask(null);
      setIsModalOpen(true);
    }
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
            onAddTask={handleOpenAddTask}
            onOpenWhatsNew={() => setIsWhatsNewOpen(true)}
            onOpenFeatures={() => setIsFeaturesOpen(true)}
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
              onDelete={handleDeleteRequest}
              onComplete={toggleTaskCompletion}
              onToggleFocus={toggleFocus}
              onUpdateTask={updateTaskById}
              onAddTask={handleOpenAddTask}
              onOpenProgress={handleOpenProgress}
            />
          )}

          {/* Floating Dock — always visible at bottom of active workspace */}
          <FloatingDock
            tasks={tasks}
            theme={settings.theme}
            onUpdateTask={updateTaskById}
            onComplete={toggleTaskCompletion}
            onEdit={handleEdit}
            onDelete={handleDeleteRequest}
            onCreateTask={addTask}
            defaultPriority={settings.defaultPriority}
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
      {/* Confirm Delete Modal */}
      {taskToDelete && (
        <ConfirmDeleteModal
          task={taskToDelete}
          theme={settings.theme}
          onConfirm={() => {
            deleteTask(taskToDelete.id);
            setTaskToDelete(null);
          }}
          onCancel={() => setTaskToDelete(null)}
        />
      )}

      {/* What's New Modal */}
      {isWhatsNewOpen && (
        <WhatsNewModal
          onClose={() => setIsWhatsNewOpen(false)}
          theme={settings.theme}
        />
      )}

      {/* Features Modal */}
      {isFeaturesOpen && (
        <FeaturesModal
          onClose={() => setIsFeaturesOpen(false)}
          theme={settings.theme}
        />
      )}

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Floating Task List Bubble */}
      <FloatingTaskListBubble
        tasks={tasks}
        onEdit={handleEdit}
        theme={settings.theme}
      />
    </div>
  );
}

export default Dashboard;