import { sep } from "@tauri-apps/api/path";
import { UnlistenFn } from "@tauri-apps/api/event";
import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from "react";

import { useExplorerHistory, useNotificationStore } from "../zustand";
import { readDir, getDisks, watchDir } from "../tauriAPIWrapper";
import { Event as TauriEvent } from "@tauri-apps/api/event";

export const useWatchPathChange = () => {
    const [loading, setLoading] = useState(false);
    const [files, setFiles] = useState<CFile[]>([]);

    const { currentPath } = useExplorerHistory();
    const { addNotification } = useNotificationStore();

    const u = useRef<{
        unwatch: () => Promise<void>;
        unlisten: UnlistenFn;
    } | undefined>(undefined);

    const updateFilesOnDirChange = useCallback((
        { payload }: TauriEvent<ChangesInDirectoryPayload>,
        handleFiles: Dispatch<SetStateAction<CFile[]>>
    ) => {
        switch (payload.type) {
            case "remove": {
                handleFiles(prev => prev.filter(f => f.name !== payload.name));

                break;
            }
            case "create": {
                handleFiles(prev => prev.concat(payload.fileInfo));

                break;
            }
            case "modify":
                if (payload.kind.modify.mode === "from") {
                    handleFiles(prev => prev.filter(f => f.name !== payload.name));
                } else {
                    handleFiles(prev => prev.concat(payload.fileInfo));
                }

                break;
            case "any":
            case "other":
            case "access":
                console.warn("unhandled dir change: ", payload);
        }
    }, []);

    const getFilesInDirectory = useCallback(async () => {
        setLoading(true);

        if (u.current) {
            u.current.unlisten();
            await u.current.unwatch();
            u.current = undefined;
        }

        try {
            if (currentPath) {
                const path = currentPath + sep;

                setFiles(await readDir(path));

                u.current = await watchDir(path, (e) => updateFilesOnDirChange(e, setFiles));
            } else {
                setFiles(await getDisks());
            }
        } catch (error) {
            addNotification({
                message: JSON.stringify(error),
                type: "error"
            });
            console.error(error);
        }

        setLoading(false);
    }, [addNotification, currentPath, updateFilesOnDirChange]);

    useEffect(() => {
        if (u.current) {
            u.current.unwatch();
            u.current.unlisten();
        }
    }, []);

    useEffect(() => {
        getFilesInDirectory();
    }, [currentPath, getFilesInDirectory]);

    return { files, loading };
};
