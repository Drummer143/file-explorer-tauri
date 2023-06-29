import React from "react";

import { openFile } from "../../../tauriAPIWrapper";
import { useExplorerHistory } from "../../../zustand";

const ExplorerContextMenu: React.FC = () => {
    const { currentPath } = useExplorerHistory();

    const handleOpenInExplorer = () => openFile(currentPath);

    if (!currentPath) {
        return <></>;
    }

    return (
        <>
            <button onClick={handleOpenInExplorer}>Open folder in explorer</button>
        </>
    );
};

export default ExplorerContextMenu;
