import { invoke } from '@tauri-apps/api';

export const openInExplorer = async (pathToDir = '') => {
    try {
        await invoke('open_in_explorer', { pathToDir })
    } catch (error) {
        throw error as string;
    };
}
