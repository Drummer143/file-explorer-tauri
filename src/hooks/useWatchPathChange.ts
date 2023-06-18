import { useEffect } from "react";

import { readDir, getDisks } from "../tauriAPIWrapper/invoke";
import { useExplorerHistory } from "../zustand";

export const useWatchPathChange = (onChange: (files: CFile[]) => void) => {
    const { currentPath } = useExplorerHistory();

    useEffect(() => {
        if (currentPath) {
            readDir(currentPath + "\\").then(onChange);
        } else {
            getDisks().then(onChange);
        }
    }, [currentPath]);
}
