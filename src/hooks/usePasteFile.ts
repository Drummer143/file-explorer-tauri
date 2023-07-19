import { dirname, sep } from "@tauri-apps/api/path";
import { useCallback } from "react";

import { copyFile, pathExists } from "@tauriAPI";
import { addNotificationFromError, clearClipboard, dispatchCustomEvent } from "@utils";

export const usePasteFile = () => {
    const checkExist = useCallback(async (newPathToFile: string, dirname: string, filename: string) => {
        const exists = await pathExists(newPathToFile);

        if (exists) {
            dispatchCustomEvent("openExistFileModal", { dirname, filename });
        }

        return exists;
    }, []);

    const checkData = useCallback(
        async (to: { dirname: string; filename?: string }, copyOptions = { overwrite: false, skipExist: false }) => {
            const { copiedFileType, pathToCopiedFile, clipboardAction } = document.documentElement.dataset;
            let copiedFilename = document.documentElement.dataset.copiedFilename;

            // "clipboard" must have all these field
            if (!copiedFileType || !pathToCopiedFile || !clipboardAction || !copiedFilename) {
                return false;
            }

            if (to.filename) {
                copiedFilename = to.filename;
            }

            // if user is pasting file in the same folder where he copied file
            if (pathToCopiedFile === to.dirname + sep + copiedFilename) {
                return false;
            }

            const newPathToFile = to.dirname + sep + copiedFilename;
            const skipExist = copyOptions.skipExist || copyOptions.overwrite;
            const exists = skipExist ? false : await checkExist(newPathToFile, to.dirname, copiedFilename);

            if (exists) {
                return false;
            }

            return {
                copiedFileType,
                copiedFilename,
                pathToCopiedFile,
                clipboardAction,
                newPathToFile
            };
        },
        [checkExist]
    );

    const paste = useCallback(async (
        to: { dirname: string; filename?: string },
        copyOptions: FileCopyOptions = { overwrite: false, skipExist: false }
    ) => {
        const isOk = await checkData(to, copyOptions);

        if (!isOk) {
            return;
        }

        const { copiedFileType, pathToCopiedFile, copiedFilename, clipboardAction, newPathToFile } = isOk;

        const id = Math.floor(Math.random() * 1000);

        const dirnameFrom = await dirname(pathToCopiedFile);

        dispatchCustomEvent("startTrackingClipboardAction", {
            eventId: id,
            from: dirnameFrom,
            to: to.dirname,
            filename: copiedFilename,
            action: clipboardAction as "copy" | "cut"
        });

        copyOptions.removeTargetOnFinish = clipboardAction === "cut";

        try {
            if (copiedFileType === "file") {
                copyFile(pathToCopiedFile, newPathToFile, id, copyOptions);
            } else {
                clearClipboard();

                return console.error("unimplemented");
            }
        } catch (error) {
            addNotificationFromError(error);
        }
    },
        [checkData]
    );

    return paste;
};
