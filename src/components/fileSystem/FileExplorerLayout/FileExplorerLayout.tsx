import { useEffect, useState } from 'react';

import PathInput from '../PathInput/PathInput';
// import useListenElectronEvents from '../../../hooks/useListenElectronEvents';

import { event } from '@tauri-apps/api';
import { readDir } from './../../../tauriInvokeWrapper';
import { useHistoryStore } from '../../../stores/historyStore';
import FileList from '../FileList/FileList';

function FileExplorerLayout() {
    const { currentPath } = useHistoryStore();
    const [files, setFiles] = useState<CFile[]>([]);
    const [isFilesLoading, setIsFilesLoading] = useState(true);

    // const handleKeyDown = (e: KeyboardEvent) => {
    //     if (e.ctrlKey && e.shiftKey && e.code === 'KeyE') {
    //         window.electronAPI.openInExplorer(currentPath);
    //     }
    // }

    // useEffect(() => {
    //     document.addEventListener('keydown', handleKeyDown);

    //     return () => {
    //         document.removeEventListener('keydown', handleKeyDown);
    //     }
    // }, [currentPath]);

    const openDir = async (path: string) => {
        readDir(path ? `${path}\\` : path)
            .then(({ files }) => {
                setFiles(files);
                setIsFilesLoading(false);
            })
            .catch(error => console.error(error))
    }

    useEffect(() => {
        // TODO: FINISH THIS
        event.listen('changes-in-dir', e => console.log(e.payload));
    }, [])

    useEffect(() => {
        openDir(currentPath)
    }, [currentPath])

    return (
        <>
            <PathInput setIsFilesLoading={setIsFilesLoading} />

            <FileList
                isFilesLoading={isFilesLoading}
                setIsFilesLoading={setIsFilesLoading}
                files={files}
            />
        </>
    );
}

export default FileExplorerLayout;
