import { sep } from "@tauri-apps/api/path";
import { useCallback } from "react";

import { copy } from "../tauriAPIWrapper";
import { isErrorMessage } from "../utils";
import { useExplorerHistory, useNotificationStore } from "../zustand";

export const usePasteFile = () => {
    const { currentPath } = useExplorerHistory();
    const { addNotification } = useNotificationStore();

    const paste = useCallback(async (to: string) => {
        const { copiedFile, clipboardAction } = document.documentElement.dataset;

        if (!copiedFile || !clipboardAction) {
            return;
        }

        try {
            if (clipboardAction === "copy") {
                await copy(copiedFile, to + sep + copiedFile.split(sep).at(-1));
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
    }, [addNotification, currentPath]);

    return paste;
};