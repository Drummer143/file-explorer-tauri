import { useEffect, useCallback, useState } from 'react';

import Navbar from './Navbar/Navbar';
import FileList from './FileList/FileList';
import useHistoryStore from 'src/stores/historyStore';
import useFileExplorerState from 'src/stores/FileExplorerStore';
import { event } from '@tauri-apps/api';
import { openInExplorer, readDir } from 'src/tauriCLIWrapper/invoke';

function FileExplorerLayout() {
    const { setFiles } = useFileExplorerState(state => state);
    const { currentPath } = useHistoryStore(state => state);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.ctrlKey && e.shiftKey && e.code === 'KeyE') {
            openInExplorer(currentPath).catch((error) => console.error(error));
        }
    }, [currentPath]);

    const openDir = async (path: string) => {
        try {
            const { files } = await readDir(path ? `${path}\\` : path)

            setFiles(files);
        } catch (error) {
            console.error(error);
        }
    }

    useEffect(() => {
        event.listen<Events['changes-in-dir']>('changes-in-dir', ({ payload }) => {
            console.log(payload);
        });

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        }
    }, [])

    useEffect(() => {
        openDir(currentPath)
    }, [currentPath]);

    return (
        <>
            <Navbar />

            <FileList />
        </>
    );
}

export default FileExplorerLayout;
