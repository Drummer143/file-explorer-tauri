import { useEffect } from "react";
import { useParams } from "react-router-dom";

import { readDir, getDisks } from "../tauriAPIWrapper/invoke";

export const useWatchPathChange = (onChange: (files: CFile[]) => void) => {
    const { path } = useParams<{ path: string }>();

    useEffect(() => {
        if (path) {
            readDir(path + "\\").then(onChange);
        } else {
            getDisks().then(onChange);
        }
    }, [path]);
}
