import React, { useState } from "react";
import { sep } from "@tauri-apps/api/path";

import { useExplorerHistory } from "@zustand";
import { openInExplorer, openFile, remove } from "@tauriAPI";
import { addFileInClipboard, addNotificationFromError, pasteFile } from "@utils";
import { useTranslation } from "react-i18next";

type FileContextMenuProps = {
    ctxTarget: HTMLElement;
};

const FileContextMenu: React.FC<FileContextMenuProps> = ({ ctxTarget }) => {
    const { currentPath, pushRoute } = useExplorerHistory();
    const { t } = useTranslation("translation", { keyPrefix: "ctx" });

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

    const handleAddFileInClipboard = (action: "copy" | "cut") => {
        if (filetype !== "file" && filetype !== "folder") {
            return;
        }

        addFileInClipboard({ dirname: currentPath + sep + filename, filename, filetype, action });
    };

    const handleMovePasteFile = () => pasteFile({ dirname: currentPath + sep + filename });

    return (
        <>
            <button onClick={handleOpenFile}>{t("open")}</button>

            <button onClick={handleOpenInExplorer}>{filetype === "file" ? t("showInNativeExplorer") : t("openInNativeExplorer")}</button>

            {!readonly && (
                <>
                    <button onClick={handleDeleteFile}>{t("delete")}</button>

                    <button onClick={handleRenameFile}>{t("rename")}</button>

                    <button onClick={() => handleAddFileInClipboard("copy")}>{t("copy")}</button>

                    <button onClick={() => handleAddFileInClipboard("cut")}>{t("cut")}</button>
                </>
            )}

            {filetype === "folder" && document.documentElement.dataset.pathToCopiedFile && !readonly && (
                <button onClick={handleMovePasteFile}>{t("paste")}</button>
            )}
        </>
    );
};

export default FileContextMenu;
