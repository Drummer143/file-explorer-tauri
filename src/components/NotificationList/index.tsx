import React, { useEffect, useState } from "react";
import { v4 } from "uuid";

import AppNotificationComponent from "./Notification";
import { useAppState } from "@zustand";

import styles from "./NotificationList.module.scss";

const NotificationList: React.FC = () => {
    const { notificationLiveTime, notificationTick, notificationLimit } = useAppState();

    const [notifications, setNotifications] = useState<(AppNotification & { index: string })[]>([]);

    const handleRemoveNotification = (index: string) => setNotifications(prev => prev.filter(n => n.index !== index));

    useEffect(() => {
        const handleAddNotification: CustomEventHandler<"addNotification"> = e => {
            const index = v4();

            setNotifications(prev => {
                if (prev.length >= notificationLimit) {
                    prev.shift();
                }

                return prev.concat({ ...e.detail, index });
            });
        };

        document.addEventListener("addNotification", handleAddNotification);

        return () => {
            document.removeEventListener("addNotification", handleAddNotification);
        };
    }, [notificationLimit]);

    return (
        <div
            className={styles.wrapper}
            style={
                {
                    "--notification-live-time": notificationLiveTime,
                    "--notification-tick-speed": notificationTick + "ms"
                } as React.CSSProperties
            }
        >
            {notifications.map(n => (
                <AppNotificationComponent key={n.index} {...n} onRemove={handleRemoveNotification} />
            ))}
        </div>
    );
};

export default NotificationList;
