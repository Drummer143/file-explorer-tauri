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

const File: React.FC<ExplorerFile> = ({ name, size, readonly, subtype }) => {
    const { currentPath } = useExplorerHistory();

    const handleAction = () => openFile(currentPath + sep + name).catch(error => console.error(error));

    return (
        <FileListItemButton
            title={name}
            onAction={handleAction}
            className={styles.wrapper}
            data-file-type="file"
            data-readonly={readonly}
            data-file-subtype={subtype}
            data-context-menu-type={CTXTypes.file}
            data-filename={name}
            data-filename-lowercased={name.toLocaleLowerCase()}
        >
            <div className={styles.icon}>
                {subtype === "image" ? <img src={convertFileSrc(currentPath + sep + name)} /> : <FileSVG />}
            </div>

            <div className={styles.description}>
                <p className={styles.name}>{name}</p>
                <p className={styles.size}>{xbytes(size, { fixed: size ? 2 : 0 })}</p>
            </div>
        </FileListItemButton>
    );
};

export default File;
