import React from "react";
import { sep } from "@tauri-apps/api/path";

import { useExplorerHistory } from "../../../zustand";
import { deleteFile, openFile } from "../../../tauriAPIWrapper";

type FileContextMenuProps = {
    filename: string;
    fileType: "disk" | "file" | "folder";
};

const FileContextMenu: React.FC<FileContextMenuProps> = ({ filename, fileType }) => {
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

    return (
        <>
            <button onClick={handleOpenFile}>Open</button>

            <button onClick={handleOpenInExplorer}>{fileType === "file" ? "Show" : "Open"} in explorer</button>

            {fileType !== "disk" && <button onClick={() => deleteFile(currentPath + sep + filename)}>Delete</button>}
        </>
    );
};

export default FileContextMenu;
