import { invoke } from "@tauri-apps/api/core";

export const openInExplorer = (pathToFile: string): Promise<void> => invoke<void>("open_in_explorer", { pathToFile });

export const openFile = (pathToFile: string): Promise<void> => invoke<void>("open_file", { pathToFile });

export const removeRaw = (path: string): Promise<void> => invoke<void>("remove", { path });
