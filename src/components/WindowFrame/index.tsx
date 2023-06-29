import React from "react";

import WindowControlButtons from "./WindowControlButtons";

import styles from "./WindowFrame.module.scss";

const WindowFrame: React.FC = () => {
    return (
        <div className={styles.wrapper} data-tauri-drag-region>
            <div>{document.title}</div>

            <WindowControlButtons />
        </div>
    );
};

export default WindowFrame;
