import React, { useEffect, useState } from "react";
import { sep } from "@tauri-apps/api/path";
import { useTranslation } from "react-i18next";

import { useRefState } from "@hooks";
import { useExplorerHistory, useFilesSelectionStore } from "@zustand";
import { openInExplorer, openFile, removeAny, removeMultiple } from "@tauriAPI";
import { addFileInClipboard, addNotificationFromError, pasteFile } from "@utils";

type FileContextMenuProps = {
    ctxTarget: HTMLElement;
};

const FileContextMenu: React.FC<FileContextMenuProps> = ({ ctxTarget }) => {
    const { currentPath, pushRoute } = useExplorerHistory();
    const { setSelectedItems, selectedItems } = useFilesSelectionStore();

    const selectedItemsRef = useRefState(selectedItems);

    const { t } = useTranslation("translation", { keyPrefix: "ctx" });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const [filename] = useState(ctxTarget.dataset.filename!);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const [filetype] = useState(ctxTarget.dataset.fileType!);
    const [readonly] = useState(ctxTarget.dataset.readonly === "true");

    const handleOpenFile = () => {
        const path = currentPath ? currentPath + sep() + filename : filename;

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
                path = filename + sep();
                break;
            case "folder":
            case "file":
            default:
                path = currentPath + sep() + filename;
                break;
        }

        openInExplorer(path).catch(addNotificationFromError);
    };

    const handleDeleteFile = async () => {
        const selectedFiles = selectedItemsRef.current;

        try {
            if (selectedFiles.length > 1) {
                const paths = Array.from(selectedFiles).map(file => currentPath + sep() + file);

                removeMultiple(paths);
            } else {
                removeAny(currentPath + sep() + filename);
            }
        } catch (error) {
            addNotificationFromError(error);
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
        if (!selectedItemsRef.current.includes(filename)) {
            setSelectedItems([filename]);
        }
    }, [filename, selectedItemsRef, setSelectedItems]);

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
