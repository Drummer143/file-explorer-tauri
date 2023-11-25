import { sep } from "@tauri-apps/api/path";
import { UnlistenFn } from "@tauri-apps/api/event";
import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from "react";

import { useExplorerHistory } from "../zustand";
import { Event as TauriEvent } from "@tauri-apps/api/event";
import { addNotificationFromError } from "@utils";
import { readDir, getDisks, watchDir } from "../tauriAPIWrapper";
import { useSnapshot } from "valtio";

export const useWatchPathChange = () => {
    const { getCurrentPath, currentPath } = useExplorerHistory();
    const { filesystem: { sort_config: sortConfig } } = useSnapshot(appConfig, { sync: true });

    const [loading, setLoading] = useState(false);
    const [files, setFiles] = useState<CFile[]>([]);

    const untrackCurrentDir = useRef<
        | {
            unwatch: () => Promise<void>;
            unlisten: UnlistenFn;
        }
        | undefined
    >(undefined);

    const updateFilesOnDirChange = useCallback(
        ({ payload }: TauriEvent<ChangesInDirectoryPayload>, handleFiles: Dispatch<SetStateAction<CFile[]>>) => {
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
                    if (payload.kind.modify.kind === "rename") {
                        if (payload.kind.modify.mode === "from") {
                            handleFiles(prev => prev.filter(f => f.name !== payload.name));
                        } else {
                            handleFiles(prev => prev.concat(payload.fileInfo));
                        }
                    } else {
                        handleFiles(prev => prev.filter(f => f.name !== payload.name).concat(payload.fileInfo));
                    }

                    break;
                case "any":
                case "other":
                case "access":
                    console.warn("unhandled dir change: ", payload);
            }
        },
        []
    );

    const getFilesInDirectory = useCallback(async () => {
        setLoading(true);

        if (untrackCurrentDir.current) {
            untrackCurrentDir.current.unlisten();
            await untrackCurrentDir.current.unwatch();
            untrackCurrentDir.current = undefined;
        }

        try {
            const currentPath = getCurrentPath();

            if (currentPath) {
                const path = currentPath + sep;

                setFiles(await readDir(path, sortConfig));

                untrackCurrentDir.current = await watchDir(path, e => updateFilesOnDirChange(e, setFiles));
            } else {
                setFiles(await getDisks());
            }
        } catch (error) {
            addNotificationFromError(error);
        }

        setLoading(false);
    }, [getCurrentPath, sortConfig, updateFilesOnDirChange]);

    useEffect(() => {
        if (untrackCurrentDir.current) {
            untrackCurrentDir.current.unwatch();
            untrackCurrentDir.current.unlisten();
        }
    }, []);

    useEffect(() => {
        getFilesInDirectory();
    }, [currentPath, getFilesInDirectory]);

    return { files, loading };
};
