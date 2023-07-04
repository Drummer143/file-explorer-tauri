import { v4 } from "uuid";
import { create } from "zustand";

interface NotificationState {
    notifications: (AppNotification & { index: string })[]
    notificationLimit: number

    addNotification: (notification: AppNotification) => void
    removeNotification: (index?: string) => void
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
    notifications: [],
    notificationLimit: 5,

    addNotification: (newNotification) => {
        console[newNotification.type](newNotification);

        const { notificationLimit, notifications } = get();

        const notificationsCopy = notifications.slice();

        if (notificationsCopy.length >= notificationLimit) {
            notificationsCopy.shift();
        }

        notificationsCopy.push({ ...newNotification, index: v4() });

        set({
            notifications: notificationsCopy
        });
    },

    removeNotification: (index) => {
        const { notifications } = get();

        let updatedNotifications: NotificationState["notifications"];

        if (index) {
            updatedNotifications = notifications.filter(n => n.index !== index);
        } else {
            updatedNotifications = notifications.slice();
            updatedNotifications.shift();
        }

        set({
            notifications: updatedNotifications
        });

    }
}));
