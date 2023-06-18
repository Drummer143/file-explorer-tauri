import { sep } from "@tauri-apps/api/path";
import { useEffect } from "react";

import { readDir, getDisks } from "../tauriAPIWrapper";
import { useExplorerHistory } from "../zustand";

export const useWatchPathChange = (onChange: (files: CFile[]) => void) => {
    const { currentPath } = useExplorerHistory();

    useEffect(() => {
        if (currentPath) {
            readDir(currentPath + sep).then(onChange);
        } else {
            getDisks().then(onChange);
        }
    }, [currentPath]);
}
