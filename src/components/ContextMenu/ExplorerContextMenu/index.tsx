import React from "react";

import { openFile } from "../../../tauriAPIWrapper";
import { pasteFile } from "../../../utils";
import { useExplorerHistory, useNotificationStore } from "../../../zustand";

const ExplorerContextMenu: React.FC = () => {
    const { currentPath } = useExplorerHistory();
    const { addNotification } = useNotificationStore();

    const handleOpenInExplorer = () => openFile(currentPath);

    const handleMovePasteFile = () => {
        const { copiedFile, clipboardAction } = document.documentElement.dataset;

        if (!copiedFile || !clipboardAction) {
            return;
        }

        if (clipboardAction === "copy") {
            pasteFile(currentPath, addNotification);
        } else {
            console.log(`moving "${copiedFile} to ${currentPath}`);

            document.documentElement.dataset.copiedFile = undefined;
            document.documentElement.dataset.clipboardAction = undefined;
        }
    };

    if (!currentPath) {
        return <></>;
    }

    return (
        <>
            <button onClick={handleOpenInExplorer}>Open folder in explorer</button>

            {currentPath && document.documentElement.dataset.copiedFile && (
                <button onClick={handleMovePasteFile}>Paste here</button>
            )}
        </>
    );
};

export default ExplorerContextMenu;
