import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import PreviewPanel from "../components/layout/PreviewPanel";
import SettingsPanel from "../components/layout/SettingsPanel";
import AddTaskModal from "../components/modals/AddTaskModal";
import ProgressTracker from "../components/layout/ProgressTracker";

import { showNotification } from "../utils/notification";
import { loadTasks, saveTasks, normalizeTask } from "../utils/taskStorage";

// Synthesized clean notification chime sound
const playNotificationSound = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const now = audioCtx.currentTime;

    // Chime Note 1 (D5)
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, now);
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc1.start(now);
    osc1.stop(now + 0.4);

    // Chime Note 2 (A5)
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880.00, now + 0.12);
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    gain2.gain.setValueAtTime(0.2, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.52);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.52);
  } catch (e) {
    console.error("Failed to play notification audio:", e);
  }
};

function Dashboard({ userProfile: propUserProfile, onLogout }) {
  const navigate = useNavigate();
  const isDesktopMode =
    new URLSearchParams(window.location.search).get("desktop") === "true";

  const fallbackUserProfile = (() => {
    try {
      const stored = localStorage.getItem("ftb_user_profile");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })();

  const userProfile = propUserProfile || fallbackUserProfile || {
    name: "Guest User",
    role: "Viewer",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=guest",
    email: "guest@bubblespace.io",
  };
  const activeUserKey = userProfile?.id || userProfile?.email || "guest";

  const [tasks, setTasks] = useState(() => loadTasks(userProfile));

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem("bubble_settings");
      return saved
        ? JSON.parse(saved)
        : {
          theme: "light",
          notificationsEnabled: true,
          autoOpenNewTask: false,
          defaultPriority: "Medium",
        };
    } catch {
      return {
        theme: "light",
        notificationsEnabled: true,
        autoOpenNewTask: false,
        defaultPriority: "Medium",
      };
    }
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [focusMode, setFocusMode] = useState(false);

  // Required states
  const [activeCategory, setActiveCategory] = useState("Dashboard");
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [priorityFilter, setPriorityFilter] = useState("all");

  useEffect(() => {
    if (!propUserProfile && !fallbackUserProfile) {
      navigate("/", { replace: true });
      return;
    }

    // Load the task list from the current user's storage key.
    // setTasks(loadTasks(userProfile));
  }, [navigate, propUserProfile, fallbackUserProfile, userProfile?.id, userProfile?.email]);

  useEffect(() => {
    // Save the task list back to the same per-user storage key for later retrieval.
    saveTasks(tasks, userProfile);
  }, [tasks, userProfile?.id, userProfile?.email]);

  useEffect(() => {
    localStorage.setItem("bubble_settings", JSON.stringify(settings));
  }, [settings]);

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

  useEffect(() => {
    const handleGlobalShortcut = (event) => {
      const isModifierPressed = event.ctrlKey || event.metaKey;
      if (!isModifierPressed || event.key.toLowerCase() !== "t") return;

      const target = event.target;
      const tagName = target?.tagName?.toLowerCase();
      const isInputField = ["input", "textarea", "select"].includes(tagName) || target?.isContentEditable;
      if (isInputField) return;

      event.preventDefault();
      setIsModalOpen(true);
    };

    document.addEventListener("keydown", handleGlobalShortcut);
    return () => {
      document.removeEventListener("keydown", handleGlobalShortcut);
    };
  }, []);

  // Notifications state
  const [notifications, setNotifications] = useState([]);


  // Track task IDs that we have already sent notifications for
  const notifiedTasksRef = useRef(new Set());

  // Ask for permission for desktop notifications on load
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);
  useEffect(() => {
    if (!settings.notificationsEnabled) {
      return;
    }

    if ("Notification" in window) {
      Notification.requestPermission();
    }

    const checkDeadlines = () => {
      const now = new Date();

      tasks.forEach((task) => {
        if (task.completed) return;

        const deadline = new Date(
          `${task.dueDate}T${task.time}:00`
        );

        const diff = deadline - now;

        const oneHour = 60 * 60 * 1000;

        if (
          diff > 0 &&
          diff <= oneHour &&
          !notifiedTasksRef.current.has(task.id)
        ) {
          notifiedTasksRef.current.add(task.id);

          playNotificationSound();

          setNotifications((prev) => [
            {
              id: Date.now(),
              text: `⏳ ${task.title} is due in less than 1 hour`,
              time: new Date().toLocaleTimeString(),
              read: false,
            },
            ...prev,
          ]);

          showNotification(task);
        }
      });
    };

    checkDeadlines();

    const interval = setInterval(
      checkDeadlines,
      60000
    );

    return () => clearInterval(interval);
  }, [tasks, settings.notificationsEnabled]);
  // Monitor deadlines every 10 seconds
  useEffect(() => {
    const checkDeadlines = () => {
      const now = new Date();
      tasks.forEach((task) => {
        if (task.completed) return;
        if (!task.dueDate || !task.time) return;

        // Parse task deadline date
        const deadline = new Date(`${task.dueDate}T${task.time}:00`);
        if (isNaN(deadline.getTime())) return;

        const diff = deadline.getTime() - now.getTime();
        const oneHourMs = 60 * 60 * 1000;

        // Check if task is within 1 hour from now and not in the past
        if (diff > 0 && diff <= oneHourMs) {
          if (!notifiedTasksRef.current.has(task.id)) {
            notifiedTasksRef.current.add(task.id);

            // Play notification sound
            playNotificationSound();

            const timeLabel = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

            // Push to internal notifications list
            setNotifications((prev) => [
              {
                id: Date.now() + task.id,
                text: `⏳ Task "${task.title}" is due in less than 1 hour!`,
                time: timeLabel,
                read: false,
              },
              ...prev,
            ]);

            // Send push notification
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification("⏳ Task Deadline Approaching!", {
                body: `"${task.title}" is due in less than 1 hour (${task.time})!`,
                icon: "🫧",
              });
            }
          }
        }
      });
    };

    checkDeadlines();
    const interval = setInterval(checkDeadlines, 10000);

    return () => clearInterval(interval);
  }, [tasks]);

  const addTask = (newTask) => {
    setTasks((prev) => [
      ...prev,
      {
        id: Date.now(),
        createdAt: newTask.createdAt || new Date().toISOString(),
        updatedAt: newTask.updatedAt || newTask.createdAt || new Date().toISOString(),
        completed: false,
        isFocused: newTask.isFocused || false,
        subtasks: newTask.subtasks || [],
        priority: newTask.priority || settings.defaultPriority,
        ...newTask,
      },
    ]);
    setIsModalOpen(false);
  };

  const updateTask = (updatedTask) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === editingTask.id ? { ...t, ...updatedTask } : t))
    );
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const deleteTask = (taskId) => {
    const deletedTask = tasks.find((t) => t.id === taskId);

    setTasks((prev) =>
      prev.filter((t) => t.id !== taskId)
    );

    if (deletedTask) {
      setNotifications((prev) =>
        prev.filter(
          (n) => !n.text.includes(deletedTask.title)
        )
      );
    }

    notifiedTasksRef.current.delete(taskId);
  };

  const toggleTaskCompletion = (taskId) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );
  };

  const toggleFocus = (taskId) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, isFocused: !t.isFocused } : t))
    );
  };

  const toggleSubtask = (taskId, subtaskId) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
            ...t,
            subtasks: t.subtasks.map((s) =>
              s.id === subtaskId ? { ...s, done: !s.done } : s
            ),
          }
          : t
      )
    );
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleSaveSettings = (newSettings) => {
    setSettings(newSettings);
  };

  const todayStr = new Date().toISOString().split("T")[0];

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    navigate("/");
  };

  // ── FILTERING LOGIC ──
  const filteredTasks = tasks.filter((t) => {
    // Hidden if completed
    if (t.completed) return false;

    // Search query match
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    if (activeCategory === "Dashboard") {
      return t.dueDate === todayStr;
    }

    if (activeCategory === "Calendar") {
      return t.dueDate === selectedDate;
    }

    if (activeCategory === "Focus Tasks") {
      return t.dueDate === selectedDate && t.isFocused;
    }

    if (activeCategory === "My Tasks") {
      return true;
    }

    if (activeCategory === "Priority Queue") {
      if (t.dueDate !== todayStr) return false;
      if (priorityFilter !== "all") {
        return t.priority.toLowerCase() === priorityFilter.toLowerCase();
      }
      return true;
    }

    return true;
  });

  const appBackgroundClass = settings.theme === "dark"
    ? "bg-slate-950 text-slate-100"
    : "bg-gradient-to-br from-[#F0F4FF] via-white to-[#F5ECFF] text-[#0F172A]";

  return (
    <div
      className={
        `h-screen w-screen flex flex-col font-sans select-none overflow-hidden ${isDesktopMode ? "bg-transparent text-[#0F172A]" : appBackgroundClass
        }`

      }
    >
      {!focusMode && !isDesktopMode && (
        <Navbar
          theme={settings.theme}
          setTheme={(newTheme) =>
            setSettings((prev) => ({
              ...prev,
              theme: newTheme,
            }))
          }
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

        {activeCategory === "Settings" ? (
          <SettingsPanel
            theme={settings.theme}
            settings={settings}
            onSave={handleSaveSettings}
            userProfile={userProfile}
            onLogout={handleLogout}
          />
        ) : activeCategory === "Progress Tracker" ? (
          <ProgressTracker tasks={tasks} theme={settings.theme} />
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
            onToggleSubtask={toggleSubtask}
            onFocusTask={(taskId) => {
              const selectedTask = tasks.find((t) => t.id === taskId);
              setTasks((prev) =>
                prev.map((t) =>
                  t.id === taskId
                    ? { ...t, isFocused: true }
                    : t
                )
              );
              if (selectedTask) {
                setSelectedDate(selectedTask.dueDate || todayStr);
                setActiveCategory("Focus Tasks");
              }
            }}
            onAddTask={() => setIsModalOpen(true)}
          />
        )}
      </div>

      {isModalOpen && (
        <AddTaskModal
          onClose={() => {
            setIsModalOpen(false);
            setEditingTask(null);
          }}
          onCreate={editingTask ? updateTask : addTask}
          editingTask={editingTask}
          defaultPriority={settings.defaultPriority}
        />
      )}
    </div>
  );
}

export default Dashboard;