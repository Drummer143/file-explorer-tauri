import React from "react";
import { useTranslation } from "react-i18next";

import SubMenu from "./SubMenu";
import Divider from "./Divider";
import MenuButton from "./MenuButton";
import { openInExplorer } from "@tauriAPI";
import { useExplorerHistory } from "@zustand";
import { dispatchCustomEvent, pasteFile } from "@utils";

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
            <SubMenu title={t("sorting")}>
                <MenuButton
                    onClick={() => setSortType("name")}
                    selected={appConfig.filesystem.sort_config.order === "name"}
                >
                    {t("name")}
                </MenuButton>

                <MenuButton
                    onClick={() => setSortType("size")}
                    selected={appConfig.filesystem.sort_config.order === "size"}
                >
                    {t("size")}
                </MenuButton>

                <Divider />

                <MenuButton onClick={() => setIncreasing(true)} selected={appConfig.filesystem.sort_config.increasing}>
                    {t("increasing")}
                </MenuButton>

                <MenuButton
                    onClick={() => setIncreasing(false)}
                    selected={!appConfig.filesystem.sort_config.increasing}
                >
                    {t("decreasing")}
                </MenuButton>
            </SubMenu>

            <Divider />

            <MenuButton onClick={handleOpenInExplorer}>{t("openInNativeExplorer")}</MenuButton>

            {document.documentElement.dataset.pathToCopiedFile && (
                <MenuButton onClick={handleMovePasteFile}>{t("paste")}</MenuButton>
            )}

            <MenuButton onClick={() => handleCreateNewEntity("file")}>{t("createNewFile")}</MenuButton>

            <MenuButton onClick={() => handleCreateNewEntity("folder")}>{t("createNewFolder")}</MenuButton>
        </>
    );
};

export default ExplorerContextMenu;
