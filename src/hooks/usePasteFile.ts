import { sep } from "@tauri-apps/api/path";
import { useCallback } from "react";

import { isErrorMessage } from "@utils";
import { copyFile, pathExists } from "@tauriAPI";
import { useExplorerHistory, /* useModalStore, */ useNotificationStore } from "@zustand";

interface PasteProps {
    to: string,
    copyOptions?: FileCopyOptions
}

export const usePasteFile = () => {
    const { currentPath } = useExplorerHistory();
    const { addNotification } = useNotificationStore();
    // const { openModal } = useModalStore();

    const checkExist = useCallback(async (to: string) => {
        const { copiedFile, clipboardAction } = document.documentElement.dataset;

        if (!copiedFile || !clipboardAction) {
            return;
        }

        const exists = await pathExists(to + sep + copiedFile.split(sep).at(-1));

        if (exists) {
            const event = new CustomEvent(
                "openExistFileModal",
                { detail: { dirname: currentPath, filename: copiedFile } }
            );

            return document.dispatchEvent(event);
        }
    }, [currentPath]);

    const paste = useCallback(async ({
        to,
        copyOptions = { overwrite: false, skipExist: false }
    }: PasteProps) => {
        const { copiedFile, clipboardAction, copiedFileType } = document.documentElement.dataset;

        if (!copiedFile || !clipboardAction) {
            return;
        }

        if (!copyOptions.skipExist) {
            const exists = await checkExist(to);

            if (exists) {
                return;
            }
        }

        try {
            console.log({ from: copiedFile, to, copyOptions });

            console.log(copyOptions);

            if (clipboardAction === "copy") {
                if (copiedFileType === "file") {
                    await copyFile(copiedFile, to, copyOptions);
                }
            } else {
                console.info(`moving "${copiedFile} to ${currentPath}`);

                document.documentElement.dataset.copiedFile = undefined;
                document.documentElement.dataset.clipboardAction = undefined;
            }
        } catch (error) {
            if (isErrorMessage(error)) {
                if (!isErrorMessage(error)) {
                    return;
                }

                const message = error.message || error.error || "Unexpected error";
                const reason = error.message && error.error ? error.error : undefined;

                addNotification({ message, type: "error", reason });
            } else if (typeof error === "string") {
                addNotification({ type: "error", message: error });
            }
        }
    }, [addNotification, checkExist, currentPath]);

    return paste;
};