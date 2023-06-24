import React from 'react';
import { sep } from "@tauri-apps/api/path";

import FileListItemButton from '../../customs/FileListItemButton';
import { CTXTypes } from '../../../utils';
import { FolderSVG } from '../../../assets';
import { useExplorerHistory } from '../../../zustand';

import styles from "./Folder.module.scss"

type FolderProps = ExplorerDirectory;

const Folder: React.FC<FolderProps> = ({ name }) => {
    const { currentPath, pushRoute } = useExplorerHistory();

    const handleAction: React.MouseEventHandler<HTMLButtonElement> = () => {
        pushRoute(currentPath + sep + name)
    }

    return (
        <FileListItemButton onAction={handleAction} className={styles.wrapper} data-context-menu-type={CTXTypes.file} data-context-menu-additional-info={name}>
            <div className={styles.icon}>
                <FolderSVG />
            </div>

            <p className={styles.description}>
                {name}
            </p>
        </FileListItemButton>
    )
}

export default Folder;