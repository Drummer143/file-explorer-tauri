import React from "react";
import { useTranslation } from "react-i18next";

import { openInExplorer } from "@tauriAPI";
import { dispatchCustomEvent, pasteFile } from "@utils";
import { useExplorerHistory } from "@zustand";

const ExplorerContextMenu: React.FC = () => {
    const { t } = useTranslation("translation", { keyPrefix: "ctx" });

    const { currentPath } = useExplorerHistory();

    const handleOpenInExplorer = () => openInExplorer(currentPath);

    const handleMovePasteFile = async () => pasteFile(currentPath);

    const handleCreateNewEntity = (type: "file" | "folder") =>
        dispatchCustomEvent("openEditFileModal", { filetype: type, dirname: currentPath });

    if (!currentPath) {
        return <></>;
    }

    return (
        <>
            <button onClick={handleOpenInExplorer}>{t("openInNativeExplorer")}</button>

            {document.documentElement.dataset.pathToCopiedFile && (
                <button onClick={handleMovePasteFile}>{t("paste")}</button>
            )}

            <button onClick={() => handleCreateNewEntity("file")}>{t("createNewFile")}</button>

            <button onClick={() => handleCreateNewEntity("folder")}>{t("createNewFolder")}</button>
        </>
    );
};

export default ExplorerContextMenu;
