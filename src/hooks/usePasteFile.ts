import { sep } from "@tauri-apps/api/path";
import { useCallback } from "react";

import { clearClipboard, dispatchCustomEvent } from "@utils";
import { copyFile, pathExists, removeCopyProcessFromState } from "@tauriAPI";
import { useExplorerHistory, useNotificationStore } from "@zustand";
import { appWindow } from "@tauri-apps/api/window";
import { Event as tauriEvent } from "@tauri-apps/api/event";
import { v4 } from "uuid";

export const usePasteFile = () => {
    // const { currentPath } = useExplorerHistory();
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

        if (!isOk) {
            return;
        }

        const {
            copiedFileType,
            pathToCopiedFile,
            clipboardAction,
            newPathToFile
        } = isOk;

        type ClipboardAction = "cf" | "cd" | "mf" | "md";

        const action: ClipboardAction = (clipboardAction === "copy" ? "c" : "m") + (copiedFileType === "file" ? "f" : "d") as ClipboardAction;
        const id = Math.floor(Math.random() * 1000);

        const handleKeyDown = (e: KeyboardEvent) => {
            console.log("before e.shiftKey", e);

            if (!e.shiftKey) {
                return;
            }

            console.log("after e.shiftKey", e);
            
            switch (e.code) {
                case "KeyP":
                    return appWindow.emit(`copy-change-state//${id}`, "pause");
                case "KeyR":
                    return appWindow.emit(`copy-change-state//${id}`, "run");
                case "KeyE":
                    return appWindow.emit(`copy-change-state//${id}`, "exit");
            }
        };

        let canLog = true;

        const u1 = await appWindow.listen(`copy-started//${id}`, e => console.log(e));
        const u2 = await appWindow.listen(`copy-progress//${id}`, e => {
            if(canLog) {
                console.log(e);

                canLog = false;

                setTimeout(() => {
                    canLog = true;
                }, 2000);
            }
        });

        appWindow.once(`copy-finished//${id}`, e => {
            console.log(e);

            removeCopyProcessFromState(id);

            document.removeEventListener("keydown", handleKeyDown);

            u1();
            u2();
        });

        document.addEventListener("keydown", handleKeyDown);

        try {
            switch (action) {
                case "cf":
                    return copyFile(pathToCopiedFile, newPathToFile, id, copyOptions);
                case "cd":
                    return console.error("unimplemented");
                case "mf":
                case "md":
                    clearClipboard();

                    return console.error("unimplemented");
            }
        } catch (error) {
            addNotificationFromError(error, "error");
        }
    }, [addNotificationFromError, checkData]);

    return paste;
};