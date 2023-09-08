import React, { useEffect, useState } from "react";
import { sep } from "@tauri-apps/api/path";
import { useTranslation } from "react-i18next";

import { openInExplorer, openFile, remove, removeMultiple } from "@tauriAPI";
import { useExplorerHistory, useFilesSelectionStore } from "@zustand";
import { addFileInClipboard, addNotificationFromError, pasteFile } from "@utils";

type FileContextMenuProps = {
    ctxTarget: HTMLElement;
};

const FileContextMenu: React.FC<FileContextMenuProps> = ({ ctxTarget }) => {
    const { currentPath, pushRoute } = useExplorerHistory();
    const { getSelectedItems, setSelectedItems } = useFilesSelectionStore();

    const { t } = useTranslation("translation", { keyPrefix: "ctx" });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const [filename] = useState(ctxTarget.dataset.filename!);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const [filetype] = useState(ctxTarget.dataset.fileType!);
    const [readonly] = useState(ctxTarget.dataset.readonly === "true");

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
        const selectedFiles = getSelectedItems();

        if (selectedFiles.size > 0) {
            const paths = Array.from(selectedFiles).map(file => currentPath + sep + file);

            removeMultiple(paths);
        } else {
            remove(currentPath + sep + filename).catch(addNotificationFromError);
        }
    };

    const handleRenameFile = () =>
        document.dispatchEvent(
            new CustomEvent("openEditFileModal", {
                detail: { filename, filetype: filetype as "file" | "folder", dirname: currentPath }
            })
        );

    const handleAddFileInClipboard = (action: "copy" | "cut") => {
        if (filetype !== "file" && filetype !== "folder") {
            return;
        }

        addFileInClipboard({ files: { filename, dirname: currentPath }, action });
    };

    const handleMovePasteFile = () => pasteFile(currentPath);

    useEffect(() => {
        if (!getSelectedItems().has(filename)) {
            setSelectedItems([filename]);
        }
    }, [filename, getSelectedItems, setSelectedItems]);

    return (
        <>
            <button onClick={handleOpenFile}>{t("open")}</button>

            <button onClick={handleOpenInExplorer}>
                {filetype === "file" ? t("showInNativeExplorer") : t("openInNativeExplorer")}
            </button>

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
