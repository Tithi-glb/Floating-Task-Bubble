export function showNotification(task) {
  if (Notification.permission === "granted") {
    new Notification("⚠️ Urgent Task", {
      body: `${task.title} at ${task.time}`,
    });
    const audio = new Audio("/sounds/notificationSound.mp3");

    audio.volume = 0.9;

    audio.play().catch((error) => {
      console.log("Could not play notification sound:", error);
    });
  }
}