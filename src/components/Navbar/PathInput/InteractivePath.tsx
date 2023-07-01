import React from "react";
import { sep } from "@tauri-apps/api/path";

import { useExplorerHistory } from "../../../zustand";

import styles from "./PathInput.module.scss";

const InteractivePath: React.FC = () => {
    const { currentPath, pushRoute } = useExplorerHistory();

    const handlePathPartClick = (partIndex: number) => {
        const currentPathParts = currentPath.split(sep);

        // partIndex equals to (part index in array + 1), so if part is last in past
        // than it is current folder and there is no need to move in this folder
        if (partIndex === currentPathParts.length) {
            return;
        }

        const newPath = currentPathParts.slice(0, partIndex + 1).join(sep);

        pushRoute(newPath);
    };

    return (
        <div className={styles.currentPath}>
            {currentPath.split(sep).map((pathPart, i, { length }) => (
                <React.Fragment key={pathPart + i}>
                    <button
                        type="button"
                        className={styles.pathPart}
                        disabled={length - 1 === i}
                        onClick={() => handlePathPartClick(i)}
                    >{pathPart}</button>

                    {length - 1 !== i && <p className={styles.pathSeparator}>{sep}</p>}
                </React.Fragment>
            ))}
        </div>
    );
};

export default InteractivePath;