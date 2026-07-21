export function showNotification(task) {
  if (Notification.permission === "granted") {
    new Notification("⚠️ Urgent Task", {
      body: `${task.title} at ${task.time}`,
    });
    const audio = new Audio("/sounds/notification.mp3");

    audio.volume = 0.7;

    audio.play().catch((error) => {
      console.log("Could not play notification sound:", error);
    });
  }
}