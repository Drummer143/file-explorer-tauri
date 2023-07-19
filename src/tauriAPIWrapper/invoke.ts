import { invoke } from "@tauri-apps/api";

export const openInExplorer = (pathToFile: string) => invoke<void>("open_in_explorer", { pathToFile });

export const openFile = (pathToFile: string) => invoke<void>("open_file", { pathToFile });

export const removeRaw = (path: string) => invoke<void>("remove", { path });
