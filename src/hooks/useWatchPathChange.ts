import { sep } from "@tauri-apps/api/path";
import { UnlistenFn, listen } from "@tauri-apps/api/event";
import { useEffect, useRef, useState } from "react";

import { useExplorerHistory } from "../zustand";
import { readDir, getDisks, watchDir } from "../tauriAPIWrapper";

export const useWatchPathChange = () => {
    const [loading, setLoading] = useState(false);
    const [files, setFiles] = useState<CFile[]>([]);

    const { currentPath } = useExplorerHistory();

    const u = useRef<{
       unwatch: () => Promise<void>;
       unlisten: UnlistenFn
    } | undefined>(undefined);

    const getFilesInDirectory = async () => {
        setLoading(true);

        console.log(currentPath);

        if (u.current) {
            u.current.unlisten();
            await u.current.unwatch();
            u.current = undefined;
        }

        try {
            if (currentPath) {
                const path = currentPath + sep;

                setFiles(await readDir(path));

                u.current = await watchDir(path, (e) => console.log(e));
            } else {
                setFiles(await getDisks());
            }
        } catch (error) {
            console.error(error);
        }

        setLoading(false);
    }

    useEffect(() => {
        if (u.current) {
            u.current.unwatch();
            u.current.unlisten();
        }
    }, []);

    useEffect(() => {
        getFilesInDirectory();
    }, [currentPath]);

    return { files, loading };
}
