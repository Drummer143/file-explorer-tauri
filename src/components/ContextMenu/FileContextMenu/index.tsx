import React from "react";
import { sep } from "@tauri-apps/api/path";

import { usePasteFile } from "@hooks";
import { openFile, remove } from "@tauriAPI";
import { copyFile, cutFile, isErrorMessage } from "@utils";
import { useExplorerHistory, useNotificationStore } from "@zustand";

type FileContextMenuProps = {
    filename: string;
    fileType: "disk" | "file" | "folder" | "image";
};

const FileContextMenu: React.FC<FileContextMenuProps> = ({ filename, fileType }) => {
    const { addNotification } = useNotificationStore();
    const { currentPath, pushRoute } = useExplorerHistory();

    const pasteFile = usePasteFile();

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

    const handleRenameFile = () =>
        document.dispatchEvent(new CustomEvent("openEditFileModal", { detail: { filename } }));

    const handleCopyFile = () => copyFile(currentPath + sep + filename, fileType);

    const handleCutFile = () => cutFile(currentPath, filename, fileType);

    const handleMovePasteFile = () => pasteFile({ to: currentPath + sep + filename });

    return (
        <>
            <button onClick={handleOpenFile}>Open</button>

            <button onClick={handleOpenInExplorer}>{fileType === "file" ? "Show" : "Open"} in explorer</button>

            {fileType !== "disk" && (
                <>
                    <button onClick={handleDeleteFile}>Delete</button>

                    <button onClick={handleRenameFile}>Rename</button>

                    <button onClick={handleCopyFile}>Copy</button>

                    <button onClick={handleCutFile}>Сut</button>
                </>
            )}

            {fileType === "folder" && document.documentElement.dataset.copiedFile && (
                <button onClick={handleMovePasteFile}>Paste in this folder</button>
            )}
        </>
    );
};

export default FileContextMenu;
