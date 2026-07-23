import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import Bubble from "../components/bubbles/Bubble";
import { getStoredUserSession } from "../utils/auth";
import { taskAPI } from "../services/api";

export default function BubblePage() {
  const { id } = useParams();
  const [currentUser] = useState(() => getStoredUserSession());
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTooltipTask, setActiveTooltipTask] = useState(null);
  const [activeProgressTask, setActiveProgressTask] = useState(null);

  // Match by string comparison of task IDs to support MongoDB string ObjectIds
  const task = tasks.find((t) => String(t.id) === String(id));

  // Keep transparent background for Electron window transparency
  useEffect(() => {
    document.documentElement.style.backgroundColor = "transparent";
    document.body.style.backgroundColor = "transparent";
  }, []);

  // Fetch tasks on load
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const fetchedTasks = await taskAPI.getTasks();
        setTasks(fetchedTasks);
      } catch (err) {
        console.error("Error loading tasks in bubble page:", err);
      } finally {
        setLoading(false);
      }
    };
    if (currentUser) {
      fetchTasks();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  const handleUpdateTask = async (taskId, patch) => {
    try {
      // Optimistic update
      setTasks((prev) => {
        const next = prev.map((t) => (t.id === taskId ? { ...t, ...patch } : t));
        return next;
      });
      await taskAPI.updateTask(taskId, patch);
    } catch (err) {
      console.error("Failed to update task in bubble page:", err);
    }
  };

  const handleComplete = async (taskId) => {
    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask) return;

    const today = new Date().toISOString().split("T")[0];
    const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const completed = !targetTask.completed;

    try {
      // Optimistic update
      setTasks((prev) => {
        const next = prev.map((t) => {
          if (t.id === taskId) {
            return {
              ...t,
              completed,
              completedDate: completed ? today : undefined,
              completedTime: completed ? nowTime : undefined,
            };
          }
          return t;
        });
        return next;
      });
      await taskAPI.updateTask(taskId, {
        completed,
        completedDate: completed ? today : "",
        completedTime: completed ? nowTime : "",
      });
    } catch (err) {
      console.error("Failed to complete task in bubble page:", err);
    }
  };

  const handleToggleFocus = async (taskId) => {
    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask) return;
    const isFocused = !targetTask.isFocused;

    try {
      // Optimistic update
      setTasks((prev) => {
        const next = prev.map((t) =>
          t.id === taskId ? { ...t, isFocused } : t
        );
        return next;
      });
      await taskAPI.updateTask(taskId, { isFocused });
    } catch (err) {
      console.error("Failed to toggle focus in bubble page:", err);
    }
  };

  const handleDelete = async (taskId) => {
    try {
      // Optimistic update
      setTasks((prev) => {
        const next = prev.filter((t) => t.id !== taskId);
        return next;
      });
      await taskAPI.deleteTask(taskId);
    } catch (err) {
      console.error("Failed to delete task in bubble page:", err);
    }
  };

  if (loading) {
    return <div className="h-screen w-screen bg-transparent" />;
  }

  if (!task) {
    return (
      <div className="h-screen w-screen bg-transparent overflow-hidden">
        {tasks.map((task) => (
          <Bubble
            key={task.id}
            task={task}
            onEdit={() => { }}
            onDelete={handleDelete}
            onComplete={handleComplete}
            onToggleFocus={handleToggleFocus}
            onUpdateTask={handleUpdateTask}
            activeTooltipTask={activeTooltipTask}
            setActiveTooltipTask={setActiveTooltipTask}
            activeProgressTask={activeProgressTask}
            setActiveProgressTask={setActiveProgressTask}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex items-center justify-center overflow-hidden bg-transparent">
      <Bubble
        task={task}
        onEdit={() => { }}
        onDelete={handleDelete}
        onComplete={handleComplete}
        onToggleFocus={handleToggleFocus}
        onUpdateTask={handleUpdateTask}
        activeTooltipTask={activeTooltipTask}
        setActiveTooltipTask={setActiveTooltipTask}
        activeProgressTask={activeProgressTask}
        setActiveProgressTask={setActiveProgressTask}
      />
    </div>
  );
}
