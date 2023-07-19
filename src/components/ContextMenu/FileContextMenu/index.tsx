import React, { useState } from "react";
import { sep } from "@tauri-apps/api/path";

import { usePasteFile } from "@hooks";
import { useExplorerHistory } from "@zustand";
import { openInExplorer, openFile, remove } from "@tauriAPI";
import { addFileInClipboard, addNotificationFromError } from "@utils";

type FileContextMenuProps = {
    ctxTarget: HTMLElement
};

const FileContextMenu: React.FC<FileContextMenuProps> = ({ ctxTarget }) => {
    const { currentPath, pushRoute } = useExplorerHistory();

    const pasteFile = usePasteFile();

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const [filename] = useState(ctxTarget.dataset.filename!);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const [filetype] = useState(ctxTarget.dataset.fileType!);
    const [readonly] = useState(ctxTarget.dataset.readonly);

    const handleOpenFile = () => {
        const path = currentPath ? currentPath + sep + filename : filename;

        if (filetype === "file") {
            openFile(path);
        } else {
            pushRoute(path);
        }
    };

    const handleOpenInExplorer = () => {
        let path: string;

        switch (filetype) {
            case "disk":
                path = filename + sep;
                break;
            case "folder":
            case "file":
            default:
                path = currentPath + sep + filename;
                break;
        }

        openInExplorer(path).catch(addNotificationFromError);
    };

    const handleDeleteFile = () => {
        remove(currentPath + sep + filename).catch(addNotificationFromError);
    };

    const handleRenameFile = () =>
        document.dispatchEvent(new CustomEvent("openEditFileModal", { detail: { filename } }));

    const handleAddFileInClipboard = (action: "copy" | "cut") =>
        addFileInClipboard(currentPath + sep + filename, filename, filetype, action);

    const handleMovePasteFile = () => pasteFile({ dirname: currentPath + sep + filename });

    return (
        <>
            <button onClick={handleOpenFile}>Open</button>

            <button onClick={handleOpenInExplorer}>{filetype === "file" ? "Show" : "Open"} in explorer</button>

            {!readonly && (
                <>
                    <button onClick={handleDeleteFile}>Delete</button>

                    <button onClick={handleRenameFile}>Rename</button>

                    <button onClick={() => handleAddFileInClipboard("copy")}>Copy</button>

                    <button onClick={() => handleAddFileInClipboard("cut")}>Сut</button>
                </>
            )}

            {filetype === "folder" && document.documentElement.dataset.pathToCopiedFile && !readonly && (
                <button onClick={handleMovePasteFile}>
                    {document.documentElement.dataset.clipboardAction === "copy" ? "Copy " : "Move "}
                    in this folder
                </button>
            )}
        </>
    );
};

export default FileContextMenu;
