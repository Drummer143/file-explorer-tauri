import React from "react";
import { useTranslation } from "react-i18next";

import { openInExplorer } from "@tauriAPI";
import { dispatchCustomEvent, pasteFile } from "@utils";
import { useExplorerHistory } from "@zustand";
import SubMenu from "../SubMenu";
import Divider from "../Divider";

const ExplorerContextMenu: React.FC = () => {
    const { t } = useTranslation("translation", { keyPrefix: "ctx" });

    const { getCurrentPath } = useExplorerHistory();

    const handleOpenInExplorer = () => openInExplorer(getCurrentPath());

    const handleMovePasteFile = async () => pasteFile(getCurrentPath());

    const handleCreateNewEntity = (type: "file" | "folder") =>
        dispatchCustomEvent("openEditFileModal", { filetype: type, dirname: getCurrentPath() });

    const setSortType = (order: SortOrder) => (appConfig.filesystem.sort_config.order = order);

    const setIncreasing = (increasing: boolean) => (appConfig.filesystem.sort_config.increasing = increasing);

    if (!getCurrentPath()) {
        return <></>;
    }

    return (
        <>
            <SubMenu title="Sorting">
                <button
                    onClick={() => setSortType("name")}
                    disabled={appConfig.filesystem.sort_config.order === "name"}
                    aria-selected={appConfig.filesystem.sort_config.order === "name"}
                >
                    Name
                </button>

                <button
                    onClick={() => setSortType("size")}
                    disabled={appConfig.filesystem.sort_config.order === "size"}
                    aria-selected={appConfig.filesystem.sort_config.order === "size"}
                >
                    Size
                </button>

                <Divider />

                <button
                    onClick={() => setIncreasing(true)}
                    disabled={appConfig.filesystem.sort_config.increasing}
                    aria-selected={appConfig.filesystem.sort_config.increasing}
                >
                    Increasing
                </button>

                <button
                    onClick={() => setIncreasing(false)}
                    disabled={!appConfig.filesystem.sort_config.increasing}
                    data-selected={!appConfig.filesystem.sort_config.increasing}
                >
                    Decreasing
                </button>
            </SubMenu>

            <Divider />

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
