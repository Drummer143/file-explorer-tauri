import { invoke } from '@tauri-apps/api';

export const openFile = async (pathToDir = '') => {
    try {
        await invoke('open_file', { pathToDir })
    } catch (error) {
        throw error as string;
    };
}
