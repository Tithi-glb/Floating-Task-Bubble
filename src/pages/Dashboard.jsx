import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import { NotificationProvider } from "../context/NotificationContext";
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
  const separator = dateStr.includes("/") ? "/" : "-";
  const parts = dateStr.split(separator).map(Number);
  if (parts.some(isNaN) || parts.length < 3) return new Date(NaN);

  let year, month, day;
  if (parts[0] > 1000) {
    [year, month, day] = parts;
  } else if (parts[2] > 1000) {
    year = parts[2];
    if (parts[0] > 12) {
      month = parts[1];
      day = parts[0];
    } else if (parts[1] > 12) {
      month = parts[0];
      day = parts[1];
    } else {
      month = parts[1];
      day = parts[0];
    }
  } else {
    [year, month, day] = parts;
  }

  const [hour, minute] = (timeStr || "00:00").split(":").map(Number);
  if (isNaN(hour) || isNaN(minute)) return new Date(NaN);
  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

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
    setEditingTask(null);
    localStorage.removeItem("ftb_task_draft");

    addToast(`Task "${createdTask.title}" created.`, "success", {
      label: "Edit",
      onClick: () => handleEdit(createdTask),
    });
  };

  const updateTask = (updatedTask) => {
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
      addToast(`Task "${deleted.title}" deleted.`, "warning");
    }
  };

  const toggleTaskCompletion = (taskId) => {
    const today = new Date().toISOString().split("T")[0];
    const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
            ...t,
            completed: !t.completed,
            completedDate: !t.completed ? today : undefined,
            completedTime: !t.completed ? nowTime : undefined,
          }
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
    <NotificationProvider tasks={tasks}>
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
            onCreate={editingTask && (!editingTask.isDraft || editingTask.isEdit) ? updateTask : addTask}
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
    </NotificationProvider>
  );
}

export default Dashboard;