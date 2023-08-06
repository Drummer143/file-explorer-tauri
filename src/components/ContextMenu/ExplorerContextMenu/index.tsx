import React from "react";
import { useTranslation } from "react-i18next";

import { openFile } from "@tauriAPI";
import { pasteFile } from "@utils";
import { useExplorerHistory } from "@zustand";

const ExplorerContextMenu: React.FC = () => {
    const { currentPath } = useExplorerHistory();
    const { t } = useTranslation("translation", { keyPrefix: "ctx" });

    const handleOpenInExplorer = () => openFile(currentPath);

    const handleMovePasteFile = async () => pasteFile({ dirname: currentPath });

    if (!currentPath) {
        return <></>;
    }

    return (
        <>
            <button onClick={handleOpenInExplorer}>{t("openInNativeExplorer")}</button>

            {currentPath && document.documentElement.dataset.pathToCopiedFile && (
                <button onClick={handleMovePasteFile}>
                    {t("paste")}
                </button>
            )}
        </>
    );
};

export default ExplorerContextMenu;
