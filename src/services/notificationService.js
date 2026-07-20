export const notificationService = {
  isSupported: () => "Notification" in window,

  getPermission: () => {
    return notificationService.isSupported() ? Notification.permission : "default";
  },

  requestPermission: async () => {
    if (!notificationService.isSupported()) return "default";
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch {
      // Fallback for older browsers / callback-based engines
      return new Promise((resolve) => {
        Notification.requestPermission((permission) => {
          resolve(permission);
        });
      });
    }
  },

  sendNotification: (title, options = {}) => {
    if (!notificationService.isSupported() || Notification.permission !== "granted") {
      return null;
    }
    try {
      const notification = new Notification(title, {
        icon: "/favicon.ico",
        ...options,
      });
      notification.onclick = () => {
        window.focus();
      };
      return notification;
    } catch (error) {
      console.error("Error creating desktop notification:", error);
      return null;
    }
  }
};
