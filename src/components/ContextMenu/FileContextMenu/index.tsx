import React from "react";
import { sep } from "@tauri-apps/api/path";

import { usePasteFile } from "@hooks";
import { openFile, remove } from "@tauriAPI";
import { useExplorerHistory } from "@zustand";
import { addFileInClipboard, addNotificationFromError, dispatchCustomEvent } from "@utils";

type FileContextMenuProps = {
    filename: string;
    fileType: "disk" | "file" | "folder" | "image";
};

const FileContextMenu: React.FC<FileContextMenuProps> = ({ filename, fileType }) => {
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

        openFile(path).catch(addNotificationFromError);
    };

    const handleDeleteFile = () => {
        remove(currentPath + sep + filename).catch(addNotificationFromError);
    };

    const handleRenameFile = () =>
        document.dispatchEvent(new CustomEvent("openEditFileModal", { detail: { filename } }));

    const handleAddFileInClipboard = (action: "copy" | "cut") =>
        addFileInClipboard(currentPath + sep + filename, filename, fileType, action);

    const handleMovePasteFile = () => pasteFile({ dirname: currentPath + sep + filename });

    return (
        <>
            <button onClick={handleOpenFile}>Open</button>

            <button onClick={handleOpenInExplorer}>{fileType === "file" ? "Show" : "Open"} in explorer</button>

            {fileType !== "disk" && (
                <>
                    <button onClick={handleDeleteFile}>Delete</button>

                    <button onClick={handleRenameFile}>Rename</button>

                    <button onClick={() => handleAddFileInClipboard("copy")}>Copy</button>

                    <button onClick={() => handleAddFileInClipboard("cut")}>Сut</button>
                </>
            )}

            {fileType === "folder" && document.documentElement.dataset.copiedFile && (
                <button onClick={handleMovePasteFile}>Paste in this folder</button>
            )}
        </>
    );
};

export default FileContextMenu;
