import { event } from "@tauri-apps/api";
import { invoke } from "@tauri-apps/api/core";

export const unwatchDir = (id: number) => invoke<void>("unwatch", { id });

export const watchDir = async (path: string, onChangeInDir: (e: event.Event<ChangesInDirectoryPayload>) => void) => {
    if (!path) {
        return;
    }

    const id = await invoke<number>("watch_dir", { pathToDir: path });
    const unlisten = await event.listen<ChangesInDirectoryPayload>(`changes-in-dir/${id}`, onChangeInDir);

    return {
        unwatch: () => unwatchDir(id),
        unlisten
    };
};

export const readDir = (path: string, sortConfig = appConfig.filesystem.sort_config) =>
    invoke<ExplorerDirectory[]>("read_dir", { pathToDir: path, sortConfig });

export const getDisks = () => invoke<ExplorerDisk[]>("get_disks");

export const removeFile = (pathToFile: string) => invoke<void>("remove_file", { pathToFile });

export const removeDirectory = (pathToDirectory: string) => invoke<void>("remove_directory", { pathToDirectory });

export const removeAny = (pathToFile: string) => invoke<void>("remove_any", { pathToFile });

export const removeMultiple = (paths: string[]) => invoke<void>("remove_multiple", { paths });

export const rename = (oldName: string, newName: string) => invoke<void>("rename", { oldName, newName });

export const pathExists = (path: string) => invoke<boolean>("exists", { pathToFile: path });

export const copyFile = (from: string, to: string, eventId: number, removeTargetOnFinish: boolean) =>
    invoke<void>("copy_file", {
        from,
        to,
        eventId,
        removeTargetOnFinish,
        duplicateFileAction: "ask"
    });

export const copyFolder = (from: string, to: string, eventId: number, removeTargetOnFinish: boolean) =>
    invoke<void>("copy_directory", {
        from,
        to,
        eventId,
        removeTargetOnFinish,
        duplicateFileAction: "ask"
    });

export const copyMultipleFiles = (paths: PathsFromTo[], eventId: number, removeTargetOnFinish: boolean) =>
    invoke<void>("copy_multiple_files", {
        paths,
        eventId,
        removeTargetOnFinish
    });

export const addIndexToFilename = (pathToFile: string) => invoke<string>("add_index_to_filename", { pathToFile });

export const createFile = (path: string, filetype: Exclude<FileTypes, "disk">) =>
    invoke<void>("create_file", { path, filetype });

export const getFileType = (pathToFile: string) => invoke<Exclude<FileTypes, "disk">>("get_file_type", { pathToFile });

export const dirname = (path: string) => invoke<string>("dirname", { path });

export const getNestedDirnames = (pathToDir: string) => invoke<string[]>("get_dirnames", { pathToDir });

export const getDiskNames = () => invoke<string[]>("get_disk_names");

export const canonicalize = (path: string) => invoke<string>("canonicalize", { path });

export const getConfig = () => invoke<AppConfig>("get_config");
