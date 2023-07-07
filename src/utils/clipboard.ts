import { sep } from "@tauri-apps/api/path";
import { window as tWindow } from "@tauri-apps/api";

import { copy } from "../tauriAPIWrapper";
import { isErrorMessage } from "./helpers";

export const copyFile = (copiedFile: string) => {
    document.documentElement.dataset.copiedFile = copiedFile;
    document.documentElement.dataset.clipboardAction = "copy";
    document.querySelector<HTMLElement>(".cut-file")?.classList.remove("cut-file");
};

export const cutFile = (dirname: string, filename: string) => {
    document.documentElement.dataset.copiedFile = dirname + sep + filename;
    document.documentElement.dataset.clipboardAction = "cut";
    document.querySelector<HTMLElement>(".cut-file")?.classList.remove("cut-file");
    document.querySelector<HTMLElement>(`[data-context-menu-additional-info="${filename}"]`)?.classList.add("cut-file");
};

export const pasteFile = async (dirname: string, addNotification: (notification: AppNotification) => void) => {
    const { copiedFile, clipboardAction } = document.documentElement.dataset;

    if (!copiedFile || !clipboardAction) {
        return;
    }

    if (clipboardAction === "copy") {
        // console.log(`pasting "${copiedFile} to ${currentPath}`);
        // const unlistenProgress = await tWindow.appWindow.listen("copy-progress", (e) =>
        //     console.log("copy-progress", e)
        // );
        // const unlistenFinish = await tWindow.appWindow.once("copy-finished", e => console.log("copy-finished", e));

        // const unlisten = () => {
        //     unlistenFinish();
        //     unlistenProgress();
        // };

        copy(copiedFile, dirname + sep + copiedFile.split(sep).at(-1))
            .then(res => {
                // unlisten();
                console.log(res);
            })
            .catch(error => {
                // unlisten();

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
            });
    } else {
        console.log(`moving "${copiedFile} to ${dirname}`);

        document.documentElement.dataset.copiedFile = undefined;
        document.documentElement.dataset.clipboardAction = undefined;
    }
}
