import React from "react";

import AppNotificationComponent from "./Notification";
import { useAppState, useNotificationStore } from "@zustand";

import styles from "./NotificationList.module.scss";

const NotificationList: React.FC = () => {
    const { notifications } = useNotificationStore();
    const { notificationLiveTime, notificationTick } = useAppState();

    return (
        <div
            className={styles.wrapper}
            style={{
                "--notification-live-time": notificationLiveTime,
                "--notification-tick-speed": notificationTick + "ms"
            } as React.CSSProperties}
        >
            {notifications.map(n =>
                <AppNotificationComponent key={n.index} {...n} />
            )}
        </div>
    );
};

export default NotificationList;