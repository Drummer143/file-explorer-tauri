import React from "react";
import xbytes from "xbytes";
import { sep } from "@tauri-apps/api/path";
import { convertFileSrc } from "@tauri-apps/api/tauri";

import FileListItemButton from "../../customs/FileListItemButton";
import { FileSVG } from "@assets";
import { CTXTypes } from "@utils";
import { openFile } from "@tauriAPI";
import { useExplorerHistory } from "@zustand";

import styles from "./File.module.scss";

type FileProps = ExplorerFile;

const File: React.FC<FileProps> = ({ name, size, type }) => {
    const { currentPath } = useExplorerHistory();

    const handleAction = () => openFile(currentPath + sep + name).catch(error => console.error(error));

    return (
        <FileListItemButton
            onAction={handleAction}
            className={styles.wrapper}
            data-context-menu-type={CTXTypes.file}
            data-context-menu-additional-info={name}
            data-context-menu-additional-info-lowercased={name.toLocaleLowerCase()}
        >
            <div className={styles.icon}>
                {type === "file" ? <FileSVG /> : <img src={convertFileSrc(currentPath + sep + name)} />}
            </div>

            <div className={styles.description}>
                <p className={styles.name}>{name}</p>
                <p className={styles.size}>{xbytes(size, { fixed: size ? 2 : 0 })}</p>
            </div>
        </FileListItemButton>
    );
};

export default File;
