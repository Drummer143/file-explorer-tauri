import { invoke } from '@tauri-apps/api';
import useTauriFrontendStore from './zustand/tauriFrontendStore';

export const unwatchDir = () => {
    const { watcherId, deleteWatcherId } = useTauriFrontendStore()

    if (!watchDir) {
        return;
    }

    return invoke('unwatch', { id: deleteWatcherId() })
        .then(() => {
            return;
        })
}

export const watchDir = async (path: string) => {
    const { setWatcherId } = useTauriFrontendStore();

    try {
        await unwatchDir();
    } catch (err) {
        const error: number = err;

        console.warn(error);
    }

    if (!path) {
        return;
    }

    return invoke('watch_dir', { pathToDir: path })
        .then((id: number) => {

            setWatcherId(id);

            return unwatchDir;
        })
};

export const readDir = async (path: string) => {
    const files: CFile[] = await invoke('read_dir', { pathToDir: path });

    const unwatch = await watchDir(path);

    return {
        files,
        unwatch
    }
}