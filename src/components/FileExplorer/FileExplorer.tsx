import { useEffect, useCallback, useState } from 'react';

import event from 'src/tauriCLIWrapper/event';
import Navbar from './Navbar/Navbar';
import FileList from './FileList/FileList';
import useHistoryStore from 'src/stores/historyStore';
import useFileExplorerState from 'src/stores/FileExplorerStore';
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
        const unlisten = event.listen('changes-in-dir', ({ payload }) => {
            console.log(payload);
        });

        document.addEventListener('keydown', handleKeyDown);

        window.onbeforeunload = () => {
            unlisten.then(fn => fn());
            let start_data = Date.now();

            while (Date.now() - start_data < 200) { };
        }

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
