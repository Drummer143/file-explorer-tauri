import React from 'react';
import { sep } from '@tauri-apps/api/path';

import { deleteFile, openInExplorer } from '../../../tauriAPIWrapper';
import { useExplorerHistory } from '../../../zustand';

type FileContextMenuProps = {
    filename: string
};

const FileContextMenu: React.FC<FileContextMenuProps> = ({ filename }) => {
    const { currentPath } = useExplorerHistory();

    const handleOpenFile = () => openInExplorer(currentPath + sep + filename);
    const handleDeleteFile = () => deleteFile(currentPath + sep + filename);

    return (
        <>
            <button onClick={handleOpenFile}>Open File</button>
            <button onClick={handleDeleteFile}>Delete File</button>
        </>
    )
}
export default FileContextMenu;