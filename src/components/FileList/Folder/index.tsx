import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import FileListItemButton from '../../customs/FileListItemButton';
import { FolderSVG } from '../../../assets';
import { useExplorerHistory } from '../../../zustand';

import styles from "./Folder.module.scss"

type FolderProps = ExplorerDirectory;

const Folder: React.FC<FolderProps> = ({ name }) => {
    const { currentPath, pushRoute } = useExplorerHistory();

    const handleAction: React.MouseEventHandler<HTMLButtonElement> = () => {
        pushRoute(`${currentPath}\\${name}`)
    }

    return (
        <FileListItemButton onAction={handleAction} className={styles.wrapper}>
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