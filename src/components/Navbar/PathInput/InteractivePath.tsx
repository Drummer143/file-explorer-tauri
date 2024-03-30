import React, { MouseEvent, useRef } from "react";
import { sep } from "@tauri-apps/api/path";

import DirsList from "./DirsList";
import { useClickAway } from "@hooks";
import { getNestedDirnames } from "@tauriAPI";
import { useExplorerHistory } from "@zustand";
import { addNotificationFromError, joinCN } from "@utils";

import styles from "./PathInput.module.scss";

const InteractivePath: React.FC = () => {
    const { currentPath, pushRoute } = useExplorerHistory();

    const [x, setX] = React.useState(0);
    const [dirList, setDirList] = React.useState<string[] | undefined>(undefined);
    const [targetDir, setTargetDir] = React.useState<string>(currentPath);
    const [dirListIndex, setDirListIndex] = React.useState(0);

    const dirListRef = useRef<HTMLDivElement | null>(null);
    const wrapperRef = useRef<HTMLDivElement | null>(null);

    useClickAway(dirListRef, () => {
        setDirList(undefined);
        setDirListIndex(-1);
    }, ["click"]);

    const handlePathPartClick = (partIndex: number) => {
        const currentPathParts = currentPath.split(sep);

        // partIndex equals to (part index in array + 1), so if part is last in past
        // than it is current folder and there is no need to move in this folder
        if (partIndex === currentPathParts.length - 1) {
            return;
        }

        const newPath = currentPathParts.slice(0, partIndex + 1).join(sep);

        pushRoute(newPath);
    };

    const openDirsList = async (e: MouseEvent<HTMLButtonElement>, path: string, index: number) => {
        if (!path) {
            return setDirList(undefined);
        }

        try {
            const dirs = await getNestedDirnames(path);

            setTargetDir(path);
            setDirList(dirs);
            setDirListIndex(index);

            const wrapperLeft = (wrapperRef.current?.getBoundingClientRect().left || 0);
            const dirListX = (e.currentTarget || e.target)?.getBoundingClientRect().left || 0;

            setX(dirListX - wrapperLeft);
        } catch (error) {
            addNotificationFromError(error);
        }
    };

    return (
        <>
            <div className={styles.interactivePath} ref={wrapperRef}>
                {currentPath.split(sep).map((pathPart, i, arr) => (
                    <React.Fragment key={pathPart + i}>
                        <button
                            type="button"
                            className={joinCN(styles.pathPart, i === dirListIndex && styles.selected)}
                            onClick={() => handlePathPartClick(i)}
                            onContextMenu={e => openDirsList(e, arr.slice(0, i).join(sep), i)}
                        >
                            {pathPart}
                        </button>

                        {arr.length - 1 !== i && <p className={styles.pathSeparator}>{sep}</p>}
                    </React.Fragment>
                ))}
            </div>

            {dirList && (
                <DirsList
                    onClose={() => setDirList(undefined)}
                    targetDir={targetDir}
                    ref={dirListRef}
                    files={dirList}
                    x={x}
                />
            )}
        </>
    );
};

export default InteractivePath;
