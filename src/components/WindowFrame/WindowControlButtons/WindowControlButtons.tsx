import React, { useEffect, useRef, useState } from 'react';
import { appWindow } from '@tauri-apps/api/window';
import { useTranslation } from 'react-i18next';

import { CloseSVG, MaximizeSVG, MinimizeSVG, RestoreToWindowSVG } from '../../../assets';

import styles from "./WindowControlButtons.module.scss";

const WindowControlButtons: React.FC = () => {
    const { t } = useTranslation();

    const [isMaximized, setIsMaximized] = useState(false);

    const isReady = useRef(false);

    useEffect(() => {
        appWindow.isMaximized().then(res => {
            setIsMaximized(res);

            console.log(isMaximized);

            isReady.current = true;
        })
    }, []);

    const minimize = () => appWindow.minimize();
    const close = () => appWindow.close();
    const toggleFullscreen = () => {
        appWindow.toggleMaximize();

        console.log("click");

        setIsMaximized(prev => !prev);
    };

    return (
        <div className={styles.wrapper}>
            <button
                type='button'
                className={styles.windowControlButton}
                onClick={minimize}
                title={t("windowControlButtons.minimize")}
            >
                <MinimizeSVG />
            </button>

            <button
                type='button'
                className={styles.windowControlButton}
                onClick={toggleFullscreen}
                title={isMaximized ? t("windowControlButtons.restoreToWindow") : t("windowControlButtons.maximize")}
            >
                {isMaximized ? <RestoreToWindowSVG /> : <MaximizeSVG />}
            </button>

            <button
                type='button'
                className={styles.windowControlButton}
                onClick={close}
                title={t("windowControlButtons.close")}
            >
                <CloseSVG />
            </button>
        </div>
    )
}
export default WindowControlButtons;