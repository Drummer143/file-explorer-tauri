import React, { useEffect, useState } from "react";
import { appWindow } from "@tauri-apps/api/window";
import { useTranslation } from "react-i18next";

import { CloseSVG, MaximizeSVG, MinimizeSVG, RestoreToWindowSVG } from "@assets";

import styles from "./WindowControlButtons.module.scss";

const WindowControlButtons: React.FC = () => {
    const { t } = useTranslation("translation", { keyPrefix: "windowControlButtons" });

    const [isMaximized, setIsMaximized] = useState(false);

    const isWindowMaximized = async () => {
        const isMaximized = await appWindow.isMaximized();

        setIsMaximized(isMaximized);
    };

    useEffect(() => {
        isWindowMaximized();

        appWindow.onResized(isWindowMaximized);
    }, []);

    const minimize = () => appWindow.minimize();
    const close = () => appWindow.close();
    const toggleFullscreen = () => appWindow.toggleMaximize();

    return (
        <div className={styles.wrapper}>
            <button
                type="button"
                className={styles.windowControlButton}
                onClick={minimize}
                title={t("minimize")}
            >
                <MinimizeSVG />
            </button>

            <button
                type="button"
                className={styles.windowControlButton}
                onClick={toggleFullscreen}
                title={isMaximized ? t("restoreToWindow") : t("maximize")}
            >
                {isMaximized ? <RestoreToWindowSVG /> : <MaximizeSVG />}
            </button>

            <button
                type="button"
                className={styles.windowControlButton}
                onClick={close}
                title={t("close")}
            >
                <CloseSVG width={16} height={16} />
            </button>
        </div>
    );
};

export default WindowControlButtons;
