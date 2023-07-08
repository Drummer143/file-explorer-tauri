import React, { useCallback, useEffect, useRef, useState } from "react";

import { CloseSVG } from "@assets";
import { useAppState, useNotificationStore } from "@zustand";

import styles from "./Notification.module.scss";

type NotificationComponentProps = AppNotification & { index: string };

const NotificationComponent: React.FC<NotificationComponentProps> = ({ message, type, index, reason }) => {
    const { notificationLiveTime, notificationTick } = useAppState();
    const { removeNotification } = useNotificationStore();

    const [isOpened, setIsOpened] = useState(false);

    const updateInterval = useRef<NodeJS.Timer | null>(null);
    const currentTime = useRef<number>(0);
    const notificationRef = useRef<HTMLDivElement>(null);

    const mountInterval = useCallback(() => setInterval(() => {
        if (currentTime.current < notificationLiveTime) {
            currentTime.current += notificationTick;

            notificationRef.current?.style.setProperty(
                "--current-percentage",
                (currentTime.current / notificationLiveTime * 100) + "%"
            );
        } else {
            if (updateInterval.current) {
                clearInterval(updateInterval.current);
            }

            removeNotification(index);
        }
    }, notificationTick), [index, notificationLiveTime, notificationTick, removeNotification]);

    const handleCloseNotification = () => {
        if (updateInterval.current) {
            clearInterval(updateInterval.current);
        }

        removeNotification(index);
    };

    const handleMouseEnter = () => {
        if (updateInterval.current) {
            clearInterval(updateInterval.current);
        }
    };

    const handleMouseLeave = () => {
        if (updateInterval.current) {
            clearInterval(updateInterval.current);
        }

        updateInterval.current = mountInterval();
    };

    const toggleReason = () => {
        if (reason) {
            setIsOpened(prev => !prev);
        }
    };

    useEffect(() => {
        if (updateInterval.current) {
            clearInterval(updateInterval.current);
        }

        updateInterval.current = mountInterval();

        return () => {
            if (updateInterval.current) {
                clearInterval(updateInterval.current);
            }
        };
    }, [mountInterval, notificationLiveTime, notificationTick, removeNotification]);

    return (
        <div
            ref={notificationRef}
            className={styles.wrapper}
            data-type={type}
            data-has-reason={!!reason}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div className={styles.heading}>
                <p className={styles.headingText}>{type}</p>

                <button className={styles.closeButton} onClick={handleCloseNotification}><CloseSVG /></button>
            </div>

            <div className={styles.body} onClick={toggleReason}>
                <p>{message}</p>

                {!!(isOpened && reason) && <p className={styles.reason}>Reason: {reason}</p>}
            </div>
        </div>
    );
};

export default NotificationComponent;