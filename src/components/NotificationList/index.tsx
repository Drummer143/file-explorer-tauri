import React, { useEffect, useState } from "react";
import { v4 } from "uuid";

import AppNotificationComponent from "./Notification";

import styles from "./NotificationList.module.scss";

const NotificationList: React.FC = () => {
    const [notifications, setNotifications] = useState<(AppNotification & { index: string })[]>([]);

    const handleRemoveNotification = (index: string) => setNotifications(prev => prev.filter(n => n.index !== index));

    useEffect(() => {
        const handleAddNotification: DocumentEventHandler<"addNotification"> = e => {
            // eslint-disable-next-line no-console
            console[e.detail.type]("ERROR\nMessage: ", e.detail.message, "\nReason: ", e.detail.reason);

            const index = v4();

            setNotifications(prev => {
                if (prev.length >= appConfig.notification.limit) {
                    prev.shift();
                }

                return prev.concat({ ...e.detail, index });
            });
        };

        document.addEventListener("addNotification", handleAddNotification);

        return () => {
            document.removeEventListener("addNotification", handleAddNotification);
        };
    }, [notifications]);

    return (
        <div
            className={styles.wrapper}
            style={
                {
                    "--notification-live-time": appConfig.notification.lifetime_ms,
                    "--notification-tick-speed": appConfig.notification.tickspeed_ms + "ms"
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
