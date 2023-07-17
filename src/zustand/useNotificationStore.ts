import { v4 } from "uuid";
import { create } from "zustand";
import { parseTauriErrorForNotification } from "@utils";

interface NotificationState {
    notifications: (AppNotification & { index: string })[]
    notificationLimit: number

    addNotification: (notification: AppNotification) => void
    addNotificationFromError: (error: unknown, type: AppNotification["type"]) => void
    removeNotification: (index?: string) => void
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
    notifications: [],
    notificationLimit: 5,

    addNotification: (newNotification) => {
        // eslint-disable-next-line no-console
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

    addNotificationFromError: (error, type) => {
        const notificationBody = parseTauriErrorForNotification(error);

        if (notificationBody) {
            get().addNotification({ ...notificationBody, type });
        }
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
