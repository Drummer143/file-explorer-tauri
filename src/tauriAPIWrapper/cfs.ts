import { invoke, event } from "@tauri-apps/api";

export const unwatchDir = (id: number) => invoke<void>("plugin:cfs|unwatch", { id });

export const watchDir = async (path: string, onChangeInDir: (e: event.Event<ChangesInDirectoryPayload>) => void) => {
    if (!path) {
        return;
    }

    const id = await invoke<number>("plugin:cfs|watch_dir", { pathToDir: path });
    const unlisten = await event.listen<ChangesInDirectoryPayload>(`changes-in-dir/${id}`, onChangeInDir);

    return {
        unwatch: () => unwatchDir(id),
        unlisten
    };
};

export const readDir = (path: string, sortConfig = appConfig.filesystem.sort_config) =>
    invoke<ExplorerDirectory[]>("plugin:cfs|read_dir", { pathToDir: path, sortConfig });

export const getDisks = () => invoke<ExplorerDisk[]>("plugin:cfs|get_disks");

export const removeFile = (pathToFile: string) => invoke<void>("plugin:cfs|remove_file", { pathToFile });

export const removeDirectory = (pathToDirectory: string) =>
    invoke<void>("plugin:cfs|remove_directory", { pathToDirectory });

export const remove = (pathToFile: string) => invoke<void>("plugin:cfs|remove", { pathToFile });

export const removeMultiple = (paths: string[]) => invoke<void>("plugin:cfs|remove_multiple", { paths });

export const rename = (oldName: string, newName: string) => invoke<void>("plugin:cfs|rename", { oldName, newName });

export const pathExists = (path: string) => invoke<boolean>("plugin:cfs|exists", { pathToFile: path });

export const copyFile = (from: string, to: string, eventId: number, removeTargetOnFinish: boolean) =>
    invoke<void>("plugin:cfs|copy_file", {
        from,
        to,
        eventId,
        removeTargetOnFinish,
        duplicateFileAction: "ask"
    });

export const copyFolder = (
    from: string,
    to: string,
    eventId: number,
    removeTargetOnFinish: boolean
): Promise<void> =>
    invoke("plugin:cfs|copy_directory", {
        from,
        to,
        eventId,
        removeTargetOnFinish,
        duplicateFileAction: "ask"
    });

export const copyMultipleFiles = (
    paths: PathsFromTo[],
    eventId: number,
    removeTargetOnFinish: boolean
) => invoke<void>("plugin:cfs|copy_multiple_files", {
    paths,
    eventId,
    removeTargetOnFinish
});

export const printCFSState = (): Promise<void> => invoke("plugin:cfs|print_state");

export const addIndexToFilename = (pathToFile: string) =>
    invoke<string>("plugin:cfs|add_index_to_filename", { pathToFile });

export const createFile = (path: string, filetype: Exclude<FileTypes, "disk">) =>
    invoke<void>("plugin:cfs|create_file", { path, filetype });

export const getFileType = (pathToFile: string) =>
    invoke<Exclude<FileTypes, "disk">>("plugin:cfs|get_file_type", { pathToFile });
