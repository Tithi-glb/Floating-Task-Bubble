import React, { createContext, useState, useEffect, useRef } from "react";
import { notificationService } from "../services/notificationService";
import { playNotificationSound } from "../utils/playNotification";

export const NotificationContext = createContext();

// Helper to parse dates
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

function isOverdue(task) {
  if (task.completed || !task.dueDate) return false;
  const now = new Date();
  if (task.time) {
    const dl = parseLocalDateTime(task.dueDate, task.time);
    return !isNaN(dl.getTime()) && dl < now;
  }
  const d = new Date(task.dueDate);
  d.setHours(23, 59, 59, 999);
  return d < now;
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatTime(timeStr) {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12}:${m} ${ampm}`;
}

export function NotificationProvider({ children, tasks = [] }) {
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem("ftb_notifications_history");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [permission, setPermission] = useState(() => notificationService.getPermission());

  // Store last triggered timestamps
  const lastTriggeredRef = useRef({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem("ftb_notification_triggers");
      if (saved) {
        lastTriggeredRef.current = JSON.parse(saved);
      }
    } catch { }
  }, []);

  // Track task completions
  const prevCompletionsRef = useRef(new Map());

  // Persist notifications history
  useEffect(() => {
    localStorage.setItem("ftb_notifications_history", JSON.stringify(notifications));
  }, [notifications]);

  // Request permission on mount
  useEffect(() => {
    if (permission === "default") {
      notificationService.requestPermission().then((perm) => {
        setPermission(perm);
      });
    }
  }, [permission]);

  // Save triggers state
  const saveTriggers = () => {
    localStorage.setItem("ftb_notification_triggers", JSON.stringify(lastTriggeredRef.current));
  };

  const addNotificationItem = (text, type, task, isDesktopOnly = false) => {
    const timeLabel = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const newNotif = {
      id: Date.now() + Math.random(),
      text,
      type, // 'reminder' | 'dueSoon' | 'overdue' | 'completed'
      time: timeLabel,
      read: false,
      taskTitle: task?.title || "",
      taskPriority: task?.priority || "",
    };

    if (!isDesktopOnly) {
      setNotifications((prev) => [newNotif, ...prev]);
    }

    // Send native desktop notification
    const priorityText = task?.priority ? `Priority: ${task.priority}` : "";
    const dueText = task?.dueDate && task?.time ? `Due: ${formatDate(task.dueDate)} at ${formatTime(task.time)}` : "";
    const headerTitle = type === "completed" ? "Task Completed" : type === "overdue" ? "Task Overdue" : type === "dueSoon" ? "Task Due Soon" : "Task Reminder";

    notificationService.sendNotification(headerTitle, {
      body: `"${task?.title || ""}"\n${priorityText ? priorityText + "\n" : ""}${dueText}`,
      silent: true, // Make native notification silent to prevent double/clashing sounds
    });

    // Play our custom notification sound
    playNotificationSound();
  };

  // Check loop for reminders, deadlines, and overdue tasks
  useEffect(() => {
    const checkSchedulers = () => {
      const now = new Date();
      let triggersUpdated = false;

      tasks.forEach((task) => {
        // 1. Task Completion Transitions
        const wasCompleted = prevCompletionsRef.current.get(task.id);
        if (task.completed && wasCompleted === false) {
          // Task just completed!
          addNotificationItem(`🎉 Completed: "${task.title}"`, "completed", task);
          prevCompletionsRef.current.set(task.id, true);
        } else if (!task.completed) {
          prevCompletionsRef.current.set(task.id, false);
        }

        // Skip reminders / overdue checks if completed
        if (task.completed) return;

        // 2. Reminder Check
        if (task.reminderDate && task.reminderTime) {
          const reminderDateTime = parseLocalDateTime(task.reminderDate, task.reminderTime);
          if (!isNaN(reminderDateTime.getTime()) && now >= reminderDateTime) {
            const lastReminderKey = `${task.id}-reminder`;
            const lastReminder = lastTriggeredRef.current[lastReminderKey];
            const tenMinutes = 10 * 60 * 1000;

            if (!lastReminder || (now.getTime() - lastReminder >= tenMinutes)) {
              addNotificationItem(`🔔 Reminder: "${task.title}"`, "reminder", task);
              lastTriggeredRef.current[lastReminderKey] = now.getTime();
              triggersUpdated = true;
            }
          }
        }

        // 3. Due Soon Check (within 1 hour)
        if (task.dueDate && task.time) {
          const dueDateTime = parseLocalDateTime(task.dueDate, task.time);
          if (!isNaN(dueDateTime.getTime()) && now < dueDateTime) {
            const diff = dueDateTime.getTime() - now.getTime();
            if (diff > 0 && diff <= 60 * 60 * 1000) {
              const lastDueSoonKey = `${task.id}-dueSoon`;
              const lastDueSoon = lastTriggeredRef.current[lastDueSoonKey];

              if (!lastDueSoon) {
                addNotificationItem(`⏳ Due soon: "${task.title}"`, "dueSoon", task);
                lastTriggeredRef.current[lastDueSoonKey] = now.getTime();
                triggersUpdated = true;
              }
            }
          }
        }

        // 4. Overdue Check
        if (isOverdue(task)) {
          const lastOverdueKey = `${task.id}-overdue`;
          const lastOverdue = lastTriggeredRef.current[lastOverdueKey];
          const tenMinutes = 10 * 60 * 1000;

          if (!lastOverdue || (now.getTime() - lastOverdue >= tenMinutes)) {
            addNotificationItem(`⚠️ Overdue: "${task.title}"`, "overdue", task);
            lastTriggeredRef.current[lastOverdueKey] = now.getTime();
            triggersUpdated = true;
          }
        }
      });

      // Cleanup deleted tasks triggers
      const activeIds = new Set(tasks.map((t) => t.id));
      prevCompletionsRef.current.forEach((_, id) => {
        if (!activeIds.has(id)) {
          prevCompletionsRef.current.delete(id);
        }
      });

      if (triggersUpdated) {
        saveTriggers();
      }
    };

    // Initialize completion states on first run
    tasks.forEach((task) => {
      if (prevCompletionsRef.current.get(task.id) === undefined) {
        prevCompletionsRef.current.set(task.id, task.completed);
      }
    });

    checkSchedulers();
    const interval = setInterval(checkSchedulers, 5000); // Check every 5s
    return () => clearInterval(interval);
  }, [tasks]);

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        permission,
        markAsRead,
        markAllAsRead,
        clearAll,
        requestPermission: () => {
          notificationService.requestPermission().then((perm) => setPermission(perm));
        }
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
