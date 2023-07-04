import React from "react";
import { sep } from "@tauri-apps/api/path";

import { isErrorMessage } from "../../../utils";
import { openFile, remove } from "../../../tauriAPIWrapper";
import { useEditFileModalStore } from "../../../zustand";
import { useExplorerHistory, useNotificationStore } from "../../../zustand";

type FileContextMenuProps = {
    filename: string;
    fileType: "disk" | "file" | "folder" | "image";
};

const FileContextMenu: React.FC<FileContextMenuProps> = ({ filename, fileType }) => {
    const { addNotification } = useNotificationStore();
    const { currentPath, pushRoute } = useExplorerHistory();

    const { openModal } = useEditFileModalStore();

    const handleOpenFile = () => {
        const path = currentPath ? currentPath + sep + filename : filename;

        if (fileType === "file") {
            openFile(path);
        } else {
            pushRoute(path);
        }
    };

    const handleOpenInExplorer = () => {
        let path: string;

        switch (fileType) {
            case "disk":
                path = filename + sep;
                break;
            case "folder":
                path = currentPath + sep + filename;
                break;
            case "file":
            case "image":
            default:
                path = currentPath + sep;
        }

        openFile(path)
            .catch(error => {
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
    };

    const handleDeleteFile = () => {
        remove(currentPath + sep + filename)
            .catch(error => {
                if (!isErrorMessage(error)) {
                    return;
                }

                const message = error.message || error.error || "Unexpected error";
                const reason = error.message && error.error ? error.error : undefined;

                addNotification({ message, type: "error", reason });
            });
    };

    const handleRenameFile = () => openModal(filename);

    const handleCopyCutFile = (action: "copy" | "cut") => {
        document.documentElement.dataset.copiedFile = currentPath + sep + filename;
        document.documentElement.dataset.clipboardAction = action;
        document.querySelector<HTMLElement>(".cut-file")?.classList.remove("cut-file");

        if (action === "cut") {
            document.querySelector<HTMLElement>(`[data-context-menu-additional-info="${filename}"]`)?.classList.add("cut-file");
        }
    };

    const handleMovePasteFile = () => {
        const { copiedFile, clipboardAction } = document.documentElement.dataset;

        if (!copiedFile || !clipboardAction) {
            return;
        }

        if (clipboardAction === "copy") {
            console.log(`pasting "${copiedFile} to ${currentPath}`);
        } else {
            console.log(`moving "${copiedFile} to ${currentPath + sep + filename}`);

            document.documentElement.dataset.copiedFile = undefined;
            document.documentElement.dataset.clipboardAction = undefined;
        }
    };

    return (
        <>
            <button onClick={handleOpenFile}>Open</button>

            <button onClick={handleOpenInExplorer}>{fileType === "file" ? "Show" : "Open"} in explorer</button>

            {fileType !== "disk" && (
                <>
                    <button onClick={handleDeleteFile}>Delete</button>

                    <button onClick={handleRenameFile}>Rename</button>

                    <button onClick={() => handleCopyCutFile("copy")}>Copy</button>

                    <button onClick={() => handleCopyCutFile("cut")}>Сut</button>
                </>
            )}

            {fileType === "folder" && document.documentElement.dataset.copiedFile && (
                <button onClick={handleMovePasteFile}>Paste in this folder</button>
            )}
        </>
    );
};

export default FileContextMenu;
