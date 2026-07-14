export function showNotification(task) {
  if (Notification.permission === "granted") {
    new Notification("⚠️ Urgent Task", {
      body: `${task.title} at ${task.time}`,
    });
  }
}