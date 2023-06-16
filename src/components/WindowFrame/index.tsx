import React from 'react';

import WindowControlButtons from './WindowControlButtons/WindowControlButtons';

import styles from "./WindowFrame.module.scss";
import { appWindow } from '@tauri-apps/api/window';

const WindowFrame: React.FC = () => {
    console.log(appWindow.title());
    return (
        <div className={styles.wrapper} data-tauri-drag-region>
            <div>{document.title}</div>

            <WindowControlButtons />
        </div>
    );
}

export default WindowFrame
