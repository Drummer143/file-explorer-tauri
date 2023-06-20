import React from 'react';
import xbytes from 'xbytes';
import { sep } from "@tauri-apps/api/path"

import FileListItemButton from '../../customs/FileListItemButton';
import { FileSVG } from '../../../assets';
import { openInExplorer } from '../../../tauriAPIWrapper';
import { useExplorerHistory } from '../../../zustand';

import styles from "./File.module.scss";

type FileProps = ExplorerFile;

const File: React.FC<FileProps> = ({ name, size }) => {
    const { currentPath } = useExplorerHistory();

    const handleAction = () => openInExplorer(currentPath + sep + name)
        .then(() => console.log("opened"))
        .catch(error => console.log(error, "error"));

    return (
        <FileListItemButton onAction={handleAction} className={styles.wrapper}>
            <div className={styles.icon}>
                <FileSVG />
            </div>

            <div className={styles.description}>
                <p className={styles.name}>{name}</p>
                <p className={styles.size}>{xbytes(size, { fixed: size ? 2 : 0 })}</p>
            </div>
        </FileListItemButton>
    )
}

export default File;
