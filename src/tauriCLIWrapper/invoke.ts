import { invoke } from '@tauri-apps/api';

let watcherId: number;

export const unwatchDir = () => {
    if (!watcherId) {
        return;
    }

    return invoke('plugin:cfs|unwatch', { id: watcherId });
}

export const watchDir = async (path: string): Promise<void | (() => Promise<unknown>)> => {
    try {
        await unwatchDir();
    } catch (error) {
        console.warn(error);
    }

    if (!path) {
        return;
    }

    return invoke('plugin:cfs|watch_dir', { pathToDir: path })
        .then((id: number) => {
            watcherId = id;

            return unwatchDir;
        })
};

export const readDir = async (path: string) => {
    try {
        const files: CFile[] = await invoke('plugin:cfs|read_dir', { pathToDir: path });

        const unwatch = await watchDir(path);

        return {
            files,
            unwatch
        }
    } catch (error) {
        console.error(error);
        throw error as string;
    }
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