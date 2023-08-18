import React, { useCallback, useEffect, useRef, useState } from "react";

import { CloseSVG } from "@assets";

import styles from "./Notification.module.scss";
import { useTranslation } from "react-i18next";

type NotificationComponentProps = AppNotification & {
    index: string;
    onRemove: (index: string) => void;
};

const NotificationComponent: React.FC<NotificationComponentProps> = ({ message, type, index, reason, onRemove }) => {
    const { t } = useTranslation();

    const [isOpened, setIsOpened] = useState(false);

    const updateInterval = useRef<NodeJS.Timer | null>(null);
    const currentTime = useRef<number>(0);
    const notificationRef = useRef<HTMLDivElement>(null);

    const mountInterval = useCallback(
        () =>
            setInterval(() => {
                if (currentTime.current < appConfig.notification.lifetime_ms) {
                    currentTime.current += appConfig.notification.tickspeed_ms;

                    notificationRef.current?.style.setProperty(
                        "--current-percentage",
                        (currentTime.current / appConfig.notification.lifetime_ms) * 100 + "%"
                    );
                } else {
                    if (updateInterval.current) {
                        clearInterval(updateInterval.current);
                    }

                    onRemove(index);
                }
            }, appConfig.notification.tickspeed_ms),
        [index, onRemove]
    );

    const handleCloseNotification = () => {
        if (updateInterval.current) {
            clearInterval(updateInterval.current);
        }

        onRemove(index);
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
    }, [mountInterval, onRemove]);

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
                <p className={styles.headingText}>{t("notifications." + type)}</p>

                <button className={styles.closeButton} title={t("close")} onClick={handleCloseNotification}>
                    <CloseSVG strokeWidth={2} width={14} height={14} />
                </button>
            </div>

            <div className={styles.body} onClick={toggleReason}>
                <p>{message}</p>

                {!!(isOpened && reason) && <p className={styles.reason}>Reason: {reason}</p>}
            </div>
        </div>
    );
};

export default NotificationComponent;
