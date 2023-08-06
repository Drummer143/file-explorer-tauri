import React from "react";
import { sep } from "@tauri-apps/api/path";

import FileListItemButton from "../../customs/FileListItemButton";
import { CTXTypes } from "@utils";
import { FolderSVG } from "@assets";
import { useExplorerHistory } from "@zustand";

import styles from "./Folder.module.scss";

type FolderProps = ExplorerDirectory & { initialFocus?: boolean };

const Folder: React.FC<FolderProps> = ({ name, isRemovable, initialFocus }) => {
    const { currentPath, pushRoute } = useExplorerHistory();

    const handleAction = () => {
        pushRoute(currentPath + sep + name);
    };

    return (
        <FileListItemButton
            ref={ref => {
                if (initialFocus) {
                    ref?.focus();
                }
            }}
            title={name}
            onAction={handleAction}
            className={styles.wrapper}
            data-file-type="folder"
            data-readonly={isRemovable ? true : ""}
            data-context-menu-type={CTXTypes.file}
            data-filename={name}
            data-filename-lowercased={name.toLocaleLowerCase()}
        >
            <div className={styles.icon}>
                <FolderSVG />
            </div>

            <p className={styles.description}>{name}</p>
        </FileListItemButton>
    );
};

export default Folder;
