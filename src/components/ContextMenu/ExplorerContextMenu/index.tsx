import React from "react";

import { openFile } from "@tauriAPI";
import { usePasteFile } from "@hooks";
import { useExplorerHistory } from "@zustand";

const ExplorerContextMenu: React.FC = () => {
    const { currentPath } = useExplorerHistory();

    const pasteFile = usePasteFile();

    const handleOpenInExplorer = () => openFile(currentPath);

    const handleMovePasteFile = async () => pasteFile({ dirname: currentPath });

    if (!currentPath) {
        return <></>;
    }

    return (
        <>
            <button onClick={handleOpenInExplorer}>Open folder in explorer</button>

            {currentPath && document.documentElement.dataset.pathToCopiedFile && (
                <button onClick={handleMovePasteFile}>
                    {document.documentElement.dataset.clipboardAction === "copy" ? "Copy " : "Move "}
                    here
                </button>
            )}
        </>
    );
};

export default ExplorerContextMenu;
