import { invoke } from "@tauri-apps/api";

export const openFile = (pathToDir = "") => invoke<void>("open_file", { pathToDir });

export const removeRaw = (path: string) => invoke<void>("remove", { path });
