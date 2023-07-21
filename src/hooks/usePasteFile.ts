import { dirname } from "@tauri-apps/api/path";
import { useCallback } from "react";

import { copyFile } from "@tauriAPI";
import { addNotificationFromError, checkDataBeforeCopy, clearClipboard, dispatchCustomEvent } from "@utils";

export const usePasteFile = () => {

    const paste = useCallback(async (
        to: { dirname: string; filename?: string },
        copyOptions: FileCopyOptions = { overwrite: false, skipExist: false }
    ) => {
        const isOk = await checkDataBeforeCopy(to, copyOptions);

        if (!isOk) {
            return;
        }

        const { action, dirname, filename, filetype, newPathToFile, pathToSourceFile, exists } = isOk;

        if (exists) {
            return dispatchCustomEvent("openExistFileModal", { dirname: to.dirname, filename });
        }

        const id = Math.floor(Math.random() * 1000);

        dispatchCustomEvent("startTrackingClipboardAction", {
            eventId: id,
            from: dirname,
            to: to.dirname,
            filename,
            action
        });

        copyOptions.removeTargetOnFinish = action === "cut";

        try {
            if (filetype === "file") {
                copyFile(pathToSourceFile, newPathToFile, id, copyOptions);
            } else {
                clearClipboard();

                return console.error("unimplemented");
            }
        } catch (error) {
            addNotificationFromError(error);
        }
    }, []);

    return paste;
};
