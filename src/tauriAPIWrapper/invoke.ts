import { invoke } from '@tauri-apps/api';

let watcherId: number[] = [];

export const unwatchDir = () => {
    if (!watcherId.length) {
        return;
    }

    watcherId.forEach(id => invoke('plugin:cfs|unwatch', { id }));
    watcherId = [];
}

export const watchDir = async (path: string): Promise<void | (() => void)> => {
    try {
        unwatchDir();
    } catch (error) {
        console.warn(error);
    }

    if (!path) {
        return;
    }

    const id: number = await invoke('plugin:cfs|watch_dir', { pathToDir: path });

    watcherId.push(id);

    return unwatchDir;
};

export const readDir = async (path: string): Promise<CFileFileDirectory[]> => {
    unwatchDir();

    const files: CFileFileDirectory[] = await invoke('plugin:cfs|read_dir', { pathToDir: path });

    return files;
}

export const getDisks = async (): Promise<CFileDisk[]> => {
    unwatchDir();

    const files: CFileDisk[] = await invoke('plugin:cfs|get_disks');

    return files;
}

export const rename = (oldName: string, newName: string): Promise<void> => invoke('plugin:cfs|rename', { oldName, newName });

export const openInExplorer = async (pathToDir = '') => {
    try {
        await invoke('open_in_explorer', { pathToDir })
    } catch (error) {
        throw error as string;
    };
}

export const deleteFile = (pathToFile: string) => {
    invoke('plugin:cfs|check_file_before_delete', { pathToFile })
        .then(() => console.log('successful'))
        .catch((error: string) => console.error(error))
}