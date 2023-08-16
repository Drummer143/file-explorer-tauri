import { sep } from "@tauri-apps/api/path";
import { dispatchCustomEvent } from "./dom";
import { copyFile, copyFolder, pathExists } from "@tauriAPI";
import { addNotificationFromError } from "./helpers";

export const addFileInClipboard = (info: CopiedFileInfo) => {
    document.documentElement.dataset.copiedFileInfo = JSON.stringify(info);

    document.querySelector<HTMLElement>(".cut-file")?.classList.remove("cut-file");

    if (info.action === "cut") {
        document.querySelector<HTMLElement>(`[data-filename="${info.filename}"]`)?.classList.add("cut-file");
    }
};

export const clearClipboard = () => {
    document.documentElement.removeAttribute("data-copied-file-info");
    document.querySelector<HTMLElement>(".cut-file")?.classList.remove("cut-file");
};

export const checkDataBeforeCopy = async (
    to: {
        dirname: string;
        filename?: string;
    },
    copyOptions: FileCopyOptions
) => {
    const info = document.documentElement.dataset.copiedFileInfo;

    if (!info) {
        return false;
    }

    try {
        const copiedFileInfo: CopiedFileInfo = JSON.parse(info);
        const pathToSourceFile = copiedFileInfo.dirname + sep + copiedFileInfo.filename;

        if (to.filename) {
            copiedFileInfo.filename = to.filename;
        }

        // if user is pasting file in the same folder where he copied file
        if (copiedFileInfo.dirname === to.dirname) {
            return false;
        }

        const newPathToFile = to.dirname + sep + copiedFileInfo.filename;
        const skipExist = copyOptions.skipExist || copyOptions.overwrite;
        const exists = skipExist ? false : await pathExists(newPathToFile);

        return {
            ...copiedFileInfo,
            newPathToFile,
            exists,
            pathToSourceFile
        };
    } catch (_) {
        return false;
    }
};

export const pasteFile = async (
    to: { dirname: string; filename?: string },
    copyOptions: FileCopyOptions = { overwrite: false, skipExist: false }
) => {
    const isOk = await checkDataBeforeCopy(to, copyOptions);

    if (!isOk) {
        return;
    }

    const { action, dirname, filename, filetype, newPathToFile, pathToSourceFile, exists } = isOk;

    if (exists) {
        if (filetype === "file") {
            return dispatchCustomEvent("openExistFileModal", { dirname: to.dirname, filename });
        }
    }

    const id = Math.floor(Math.random() * 1000);

    dispatchCustomEvent("startTrackingClipboardAction", {
        eventId: id,
        from: dirname,
        to: to.dirname,
        filename,
        action,
        type: filetype
    });

    copyOptions.removeTargetOnFinish = action === "cut";

    try {
        if (filetype === "file") {
            copyFile(pathToSourceFile, newPathToFile, id, copyOptions);
        } else {
            copyFolder(pathToSourceFile, newPathToFile, id, {
                ...copyOptions,
                duplicateFileAction: "Ask"
            });

            // return console.error("unimplemented");
        }

        if (action === "cut") {
            clearClipboard();
        }
    } catch (error) {
        addNotificationFromError(error);
    }
};
