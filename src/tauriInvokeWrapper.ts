import { invoke } from '@tauri-apps/api';

export const readDir = (path: string): Promise<CFile[]> => invoke('read_dir', { pathToDir: path });