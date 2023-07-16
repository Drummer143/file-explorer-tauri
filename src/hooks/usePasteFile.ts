import { sep } from "@tauri-apps/api/path";
import { useCallback } from "react";

import { clearClipboard, dispatchCustomEvent } from "@utils";
import { copyFile, pathExists } from "@tauriAPI";
import { useExplorerHistory, useNotificationStore } from "@zustand";

export const usePasteFile = () => {
    const { currentPath } = useExplorerHistory();
    const { addNotificationFromError } = useNotificationStore();

    const checkExist = useCallback(async (newPathToFile: string, dirname: string, filename: string) => {
        const exists = await pathExists(newPathToFile);

        if (exists) {
            dispatchCustomEvent("openExistFileModal", { dirname, filename });
        }

        return exists;
    }, []);

    const checkData = useCallback(async (
        to: { dirname: string, filename?: string },
        copyOptions = { overwrite: false, skipExist: false }
    ) => {
        const {
            copiedFileType,
            pathToCopiedFile,
            clipboardAction
        } = document.documentElement.dataset;
        let copiedFilename = document.documentElement.dataset.copiedFilename;

        if (!copiedFileType || !pathToCopiedFile || !clipboardAction) {
            return false;
        }

        if (to.filename) {
            copiedFilename = to.filename;
        } else if (!copiedFilename) {
            return false;
        }

        if (pathToCopiedFile === to.dirname + sep + copiedFilename) {
            return false;
        }

        const newPathToFile = to.dirname + sep + copiedFilename;
        const skipExist = !copyOptions.skipExist || !copyOptions.overwrite;

        if (skipExist && await checkExist(newPathToFile, to.dirname, copiedFilename)) {
            return false;
        }

        return {
            copiedFileType,
            copiedFilename,
            pathToCopiedFile,
            clipboardAction,
            newPathToFile
        };
    }, [checkExist]);

    const paste = useCallback(async (
        to: { dirname: string, filename?: string },
        copyOptions = { overwrite: false, skipExist: false }
    ) => {
        const isOk = await checkData(to, copyOptions);

        if(!isOk) {
            return;
        }

        const {
            copiedFileType,
            copiedFilename,
            pathToCopiedFile,
            clipboardAction,
            newPathToFile
        } = isOk;

        try {
            if (clipboardAction === "copy") {
                if (copiedFileType === "file") {
                    await copyFile(pathToCopiedFile, newPathToFile, copyOptions);
                }
            } else {
                console.info(`moving "${copiedFilename} to ${currentPath}`);

                clearClipboard();
            }
        } catch (error) {
            addNotificationFromError(error, "error");
        }
    }, [addNotificationFromError, checkData, currentPath]);

    return paste;
};