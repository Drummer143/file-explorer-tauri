import { sep } from "@tauri-apps/api/path";

import { dispatchCustomEvent } from "./dom";
import { addNotificationFromError } from "./helpers";
import { copyFile, copyFolder, copyMultipleFiles, getFileType } from "@tauriAPI";

export const addFileInClipboard = (info: CopiedFileInfo) => {
    document.documentElement.dataset.copiedFileInfo = JSON.stringify(info);

    document.querySelectorAll<HTMLElement>(".cut-file").forEach(element => element.classList.remove("cut-file"));

    if (info.action === "cut") {
        if (Array.isArray(info.files)) {
            const parent = document.querySelector<HTMLElement>(`[data-filename="${info.files[0].filename}"]`);

            info.files.forEach(f => {
                parent?.querySelector<HTMLElement>(`[data-filename="${f.filename}"]`)?.classList.add("cut-file");
            });
        } else {
            document.querySelector<HTMLElement>(`[data-filename="${info.files.filename}"]`)?.classList.add("cut-file");
        }
    }
};

export const clearClipboard = () => {
    document.documentElement.removeAttribute("data-copied-file-info");
    document.querySelector<HTMLElement>(".cut-file")?.classList.remove("cut-file");
};

export const prepareDataBeforeCopy = async (to: string): Promise<false | Omit<CopiedFileInfo, "files"> & ({
    copyType: "multiple";
    paths: PathsFromTo[];
    files: PathsParts[];
} | {
    copyType: "file" | "folder";
    paths: PathsFromTo;
    files: PathsParts;
})> => {
    const info = document.documentElement.dataset.copiedFileInfo;

    if (!info) {
        return false;
    }

    try {
        const copiedFileInfo: CopiedFileInfo = JSON.parse(info);
        const mergePathParts = (dirname: string, filename: string) => dirname + sep + filename;
        const isNestedPath = (parentPath: string, nestedPath: string) => parentPath.includes(nestedPath);
        // const copyType: StartTrackingClipboardActionDetail["type"];

        if (Array.isArray(copiedFileInfo.files)) {
            const paths: PathsFromTo[] = [];

            copiedFileInfo.files.forEach(from => {
                const pathFrom = mergePathParts(from.dirname, from.filename);
                const pathTo = mergePathParts(to, from.filename);

                if (!isNestedPath(pathTo, pathFrom)) {
                    paths.push({ from: pathFrom, to: pathTo });
                }
            });

            if (!paths.length) {
                console.error("no file to copy");
                return false;
            }

            return {
                copyType: "multiple",
                action: copiedFileInfo.action,
                files: copiedFileInfo.files,
                paths
            };
        } else {
            // if user is pasting file in the same folder where he copied file
            const pathFrom = mergePathParts(copiedFileInfo.files.dirname, copiedFileInfo.files.filename);
            const pathTo = mergePathParts(to, copiedFileInfo.files.filename);
            
            if (isNestedPath(pathTo, pathFrom)) {
                console.error("copying in nested folder");
                return false;
            }

            const filetype = await getFileType(pathFrom);

            if (filetype === "unknown") {
                console.error("unknown file type", filetype);
                return false;
            }

            const paths: PathsFromTo = { from: pathFrom, to: pathTo };

            return {
                copyType: filetype,
                paths,
                action: copiedFileInfo.action,
                files: copiedFileInfo.files
            };
        }
    } catch (error) {
        console.error("can't parse clipboard");
        return false;
    }
};

export const pasteFile = async (to: string) => {
    const data = await prepareDataBeforeCopy(to);

    if (!data) {
        return console.error("corrupted data in clipboard");
    }

    // if (Array.isArray(paths) || Array.isArray(files)) {
    //     return console.error("unemplimented");
    // }

    const eventId = Math.floor(Math.random() * 1000);

    if (data.copyType === "multiple") {
        dispatchCustomEvent("startTrackingClipboardAction", {
            type: "multiple",
            action: data.action,
            paths: data.paths,
            eventId
        });

        try {
            await copyMultipleFiles(data.paths, eventId, data.action === "cut");

            if (data.action === "cut") {
                clearClipboard();
            }
        } catch (error) {
            addNotificationFromError(error);
        }
    } else {
        dispatchCustomEvent("startTrackingClipboardAction", {
            eventId,
            from: data.paths.from,
            to: data.paths.to,
            filename: data.files.filename,
            action: data.action,
            type: data.copyType
        });

        try {
            if (data.copyType === "file") {
                await copyFile(data.paths.from, data.paths.to, eventId, data.action === "cut");
            } else {
                await copyFolder(data.paths.from, data.paths.to, eventId, data.action === "cut");
            }

            if (data.action === "cut") {
                clearClipboard();
            }
        } catch (error) {
            addNotificationFromError(error);
        }
    }
};
