
import { APP_ICON_DATA_URL } from "../config/appConfig";

export interface NotificationService {
  requestPermission: () => Promise<boolean>;
  send: (title: string, options?: NotificationOptions) => boolean;
}

export const requestNotificationPermission = async (): Promise<boolean> => {
  try {
    if (!("Notification" in window)) {
      console.warn("This browser does not support desktop notification");
      return false;
    }

    if (Notification.permission === "granted") {
      return true;
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }
  } catch (e) {
    console.warn("Notification permission check failed in this context:", e);
  }

  return false;
};

export const sendNotification = (title: string, options?: NotificationOptions): boolean => {
  try {
    if (!("Notification" in window) || Notification.permission !== "granted") {
      return false;
    }

    // Only notify if the tab is hidden or the user is not actively looking at the result
    // This avoids annoying the user while they are already watching the progress
    const notification = new Notification(title, {
      icon: APP_ICON_DATA_URL,
      badge: APP_ICON_DATA_URL,
      ...options,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
    return true;
  } catch (e) {
    console.warn("Failing to send notification in this context:", e);
  }
  return false;
};

export const notificationService: NotificationService = {
  requestPermission: requestNotificationPermission,
  send: sendNotification,
};
