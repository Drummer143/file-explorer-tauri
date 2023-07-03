import React from "react";
import { sep } from "@tauri-apps/api/path";

import { isErrorMessage } from "../../../utils";
import { openFile, remove } from "../../../tauriAPIWrapper";
import { useExplorerHistory, useNotificationStore } from "../../../zustand";

type FileContextMenuProps = {
    filename: string;
    fileType: "disk" | "file" | "folder";
};

const FileContextMenu: React.FC<FileContextMenuProps> = ({ filename, fileType }) => {
    const { addNotification } = useNotificationStore();
    const { currentPath, pushRoute } = useExplorerHistory();

    const handleOpenFile = () => {
        const path = currentPath ? currentPath + sep + filename : filename;

        if (fileType === "file") {
            openFile(path);
        } else {
            pushRoute(path);
        }
    };

    const handleOpenInExplorer = () => {
        const path = fileType === "file" ? currentPath : currentPath + sep + filename;

        openFile(path);
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

    return (
        <>
            <button onClick={handleOpenFile}>Open</button>

            <button onClick={handleOpenInExplorer}>{fileType === "file" ? "Show" : "Open"} in explorer</button>

            {fileType !== "disk" && (
                <button
                    onClick={handleDeleteFile}
                >Delete</button>
            )}
        </>
    );
};

export default FileContextMenu;
