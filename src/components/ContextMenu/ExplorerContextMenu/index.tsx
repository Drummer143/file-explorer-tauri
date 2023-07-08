import React from "react";

import { openFile } from "@tauriAPI";
import { usePasteFile } from "@hooks";
import { useExplorerHistory } from "@zustand";

const ExplorerContextMenu: React.FC = () => {
    const { currentPath } = useExplorerHistory();

    const pasteFile = usePasteFile();

    const handleOpenInExplorer = () => openFile(currentPath);

    const handleMovePasteFile = () => {
        const { copiedFile, clipboardAction } = document.documentElement.dataset;

        if (!copiedFile || !clipboardAction) {
            return;
        }

        if (clipboardAction === "copy") {
            pasteFile(currentPath);
        } else {
            console.info(`moving "${copiedFile} to ${currentPath}`);

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
