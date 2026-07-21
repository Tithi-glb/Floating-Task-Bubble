export const playNotificationSound = () => {
    const audio = new Audio("/sounds/notificationSound.mp3");

    audio.volume = 0.7;

    audio.play().catch((error) => {
        console.log("Could not play notification sound:", error);
    });
};