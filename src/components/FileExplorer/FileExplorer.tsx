import { event } from '@tauri-apps/api';
import { useEffect, useState } from 'react';

import Navbar from './Navbar/Navbar';
import FileList from './FileList/FileList';
import { useHistoryStore } from 'src/stores/historyStore';
import { openInExplorer, readDir } from 'src/tauriInvokeWrapper';

function FileExplorerLayout() {
    const [files, setFiles] = useState<CFile[]>([]);
    const [isFilesLoading, setIsFilesLoading] = useState(true);
    const { currentPath } = useHistoryStore(state => state);

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.ctrlKey && e.shiftKey && e.code === 'KeyE') {
            openInExplorer(currentPath).catch((error) => console.error(error));
        }
    }

    const openDir = async (path: string) => {
        readDir(path ? `${path}\\` : path)
            .then(({ files }) => {
                setFiles(files);
                setIsFilesLoading(false);
            })
            .catch(error => console.error(error))
    }

    useEffect(() => {
        const unlisten = event.listen('changes-in-dir', e => console.info(e.payload));

        return () => {
            unlisten.then(fn => fn());
        }
    }, [])

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);

        openDir(currentPath);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        }
    }, [currentPath]);

    return (
        <>
            <Navbar />

            <FileList
                isFilesLoading={isFilesLoading}
                setIsFilesLoading={setIsFilesLoading}
                files={files}
            />
        </>
    );
}

export default FileExplorerLayout;
