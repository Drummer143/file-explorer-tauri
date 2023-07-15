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

export const readDir = (path: string) => invoke<ExplorerDirectory[]>("plugin:cfs|read_dir", { pathToDir: path });

export const getDisks = () => invoke<ExplorerDisk[]>("plugin:cfs|get_disks");

export const removeFile = (pathToFile: string) => invoke<void>("plugin:cfs|remove_file", { pathToFile });

export const removeDirectory = (pathToDirectory: string) =>
    invoke<void>("plugin:cfs|remove_directory", { pathToDirectory });

export const remove = (pathToFile: string) => invoke<void>("plugin:cfs|remove", { pathToFile });

export const rename = (oldName: string, newName: string) => invoke<void>("plugin:cfs|rename", { oldName, newName });

export const pathExists = (path: string) => invoke<boolean>("plugin:cfs|exists", { pathToFile: path });

export const copyFile = (from: string, to: string, copyOptions: FileCopyOptions) =>
    invoke("plugin:cfs|copy_file", {
        from,
        to,
        // eslint-disable-next-line camelcase
        copyOptions: { overwrite: copyOptions.overwrite, skip_exist: copyOptions.skipExist }
    });
