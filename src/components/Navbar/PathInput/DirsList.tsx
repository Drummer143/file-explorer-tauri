import { sep } from "@tauri-apps/api/path";
import { ForwardRefRenderFunction, MouseEvent, forwardRef } from "react";

import Scrollbars from "../../Scrollbars";
import { joinCN } from "@utils";
import { useExplorerHistory } from "@zustand";

import styles from "./PathInput.module.scss";

type DirsListProps = {
    x: number;
    files: string[];
    targetDir: string;
    dirToReplace: string;

    onClose: () => void;
};

const DirsList: ForwardRefRenderFunction<HTMLDivElement, DirsListProps> = (
    { dirToReplace, targetDir, onClose, files, x },
    ref
) => {
    const pushRoute = useExplorerHistory(state => state.pushRoute);

    const handleClick = (e: MouseEvent, file: string) => {
        e.stopPropagation();

        if (targetDir) {
            pushRoute(`${targetDir}${sep()}${file}`);
        } else {
            pushRoute(file);
        }

        onClose();
    };

    return (
        <div className={styles.dirsListWrapper} ref={ref} style={{ left: x }}>
            <Scrollbars className={styles.scrollBar}>
                <div className={joinCN(styles.dirsList, files.length > 5 && styles.scrollable)}>
                    {files.map((file, i) => (
                        <button
                            type="button"
                            disabled={file === dirToReplace}
                            className={joinCN(styles.dirsListButton)}
                            key={i}
                            onClick={e => handleClick(e, file)}
                        >
                            {file}
                        </button>
                    ))}
                </div>
            </Scrollbars>
        </div>
    );
};

export default forwardRef(DirsList);
