import { sep } from "@tauri-apps/api/path";

import { dispatchCustomEvent } from "./dom";
import { addNotificationFromError } from "./helpers";
import { copyFile, copyFolder, getFileType } from "@tauriAPI";

export const addFileInClipboard = (info: CopiedFileInfo) => {
    document.documentElement.dataset.copiedFileInfo = JSON.stringify(info);

    document.querySelector<HTMLElement>(".cut-file")?.classList.remove("cut-file");

    if (info.action === "cut") {
        if (Array.isArray(info.files)) {
            info.files.forEach(f => {
                document.querySelector<HTMLElement>(`[data-filename="${f}"]`)?.classList.add("cut-file");
            });
        } else {
            document.querySelector<HTMLElement>(`[data-filename="${info.files}"]`)?.classList.add("cut-file");
        }
    }
};

export const clearClipboard = () => {
    document.documentElement.removeAttribute("data-copied-file-info");
    document.querySelector<HTMLElement>(".cut-file")?.classList.remove("cut-file");
};

export const prepareDataBeforeCopy = (to: string): false | CopiedFileInfo & { paths: PathsFromTo | PathsFromTo[] } => {
    const info = document.documentElement.dataset.copiedFileInfo;

    if (!info) {
        return false;
    }

    try {
        const copiedFileInfo: CopiedFileInfo = JSON.parse(info);
        const mergePathParts = (dirname: string, filename: string) => dirname + sep + filename;
        const isNestedPath = (parentPath: string, nestedPath: string) => parentPath.includes(nestedPath);

        let paths: PathsFromTo | PathsFromTo[];

        if (Array.isArray(copiedFileInfo.files)) {
            const p: PathsFromTo[] = [];

            copiedFileInfo.files.forEach(from => {
                const pathFrom = mergePathParts(from.dirname, from.filename);
                const pathTo = mergePathParts(to, from.filename);

                if (isNestedPath(pathTo, pathFrom)) {
                    p.push({ from: pathFrom, to: pathTo });
                }
            });

            if (p.length) {
                paths = p;
            } else {
                return false;
            }
        } else {
            // if user is pasting file in the same folder where he copied file
            const pathFrom = mergePathParts(copiedFileInfo.files.dirname, copiedFileInfo.files.filename);
            const pathTo = mergePathParts(to, copiedFileInfo.files.filename);

            if (isNestedPath(pathTo, pathFrom)) {
                console.error("copying in nested folder");
                return false;
            }

            paths = { from: pathFrom, to: pathTo };
        }

        return {
            ...copiedFileInfo,
            paths
        };
    } catch (_) {
        return false;
    }
};

export const pasteFile = async (to: string) => {
    const isOk = prepareDataBeforeCopy(to);

    if (!isOk) {
        return;
    }

    const { action, paths, files } = isOk;
    // const filetype = await getFileType(pathToSourceFile);

    if (Array.isArray(paths) || Array.isArray(files)) {
        return console.error("unemplimented");
    }

    const id = Math.floor(Math.random() * 1000);
    const filetype = await getFileType(paths.from);

    dispatchCustomEvent("startTrackingClipboardAction", {
        eventId: id,
        from: paths.from,
        to: paths.to,
        filename: files.filename,
        action,
        type: filetype
    });

    try {
        if (filetype === "file") {
            copyFile(paths.from, paths.to, id, action === "cut");
        } else {
            copyFolder(paths.from, paths.to, id, action === "cut");
        }

        if (action === "cut") {
            clearClipboard();
        }
    } catch (error) {
        addNotificationFromError(error);
    }
};
