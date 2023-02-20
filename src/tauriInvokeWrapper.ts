import { invoke } from '@tauri-apps/api';

let watcherId: number;

export const unwatchDir = () => {
    if (!watcherId) {
        return;
    }

    return invoke('plugin:cfs|unwatch', { id: watcherId });
}

export const watchDir = async (path: string) => {
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
            console.log(id);
            watcherId = id;

            return unwatchDir;
        })
};

export const readDir = async (path: string) => {
    const files: CFile[] = await invoke('plugin:cfs|read_dir', { pathToDir: path });

    const unwatch = await watchDir(path);

    return {
        files,
        unwatch
    }
}

export const rename = (oldName: string, newName: string) => invoke('plugin:cfs|rename', { oldName, newName });