import React from 'react';
import xbytes from 'xbytes';
import { sep } from "@tauri-apps/api/path"

import FileListItemButton from '../../customs/FileListItemButton';
import { FileSVG } from '../../../assets';
import { CTXTypes } from '../../../utils';
import { openFile } from '../../../tauriAPIWrapper';
import { useExplorerHistory } from '../../../zustand';

import styles from "./File.module.scss";

type FileProps = ExplorerFile;

const File: React.FC<FileProps> = ({ name, size }) => {
    const { currentPath } = useExplorerHistory();

    const handleAction = () => openFile(currentPath + sep + name)
        .catch(error => console.error(error));

    return (
        <FileListItemButton onAction={handleAction} className={styles.wrapper} data-context-menu-type={CTXTypes.file} data-context-menu-additional-info={name}>
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
