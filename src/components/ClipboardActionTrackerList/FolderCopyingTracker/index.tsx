import React, { useEffect, useRef, useState } from "react";
import { sep } from "@tauri-apps/api/path";
import { appWindow } from "@tauri-apps/api/window";
import { UnlistenFn } from "@tauri-apps/api/event";

import { removeCopyProcessFromState, removeRaw } from "@tauriAPI";
import { PlaySVG, PauseSVG, CloseSVG, CheckMarkSVG } from "@assets";

import styles from "./FolderCopyingTracker.module.scss";

type CopyStatus = "preparing" | "waiting-action" | "copying" | "copy-canceled";

type FolderCopyingTrackerProps = StartTrackingClipboardActionDetail & {
    onRemove: (eventId: number) => void;
};

const FolderCopyingTracker: React.FC<FolderCopyingTrackerProps> = ({
    action,
    eventId,
    filename,
    from,
    onRemove,
    to
}) => {
    const [paused, setPaused] = useState(true);
    const [status, setStatus] = useState<CopyStatus>("preparing");

    const trackerRef = useRef<HTMLDivElement | null>(null);
    const untrack = useRef<{
        progress: UnlistenFn;
        sizing: UnlistenFn;
        finished: UnlistenFn;
    } | null>(null);

    const mountListeners = async () => {
        const sizing = await appWindow.once(`copy-ready//${eventId}`, () => {
            setStatus("copying");
        });

        const progress = await appWindow.listen<{ done: number; total: number }>(`copy-progress//${eventId}`, e => {
            trackerRef.current?.style.setProperty("--action-progress", (e.payload.done / e.payload.total) * 100 + "%");
        });

        const finished = await appWindow.once(`copy-finished//${eventId}`, () => {
            removeCopyProcessFromState(eventId);

            onRemove(eventId);

            untrack.current?.progress();
        });

        untrack.current = { progress, finished, sizing };
    };

    const togglePause = () => {
        setPaused(prev => {
            appWindow.emit(`copy-change-state//${eventId}`, prev ? "run" : "pause");

            return !prev;
        });
    };

    const handleTerminateAction = () => {
        untrack.current?.progress();
        untrack.current?.finished();

        appWindow.emit(`copy-change-state//${eventId}`, "exit");

        setStatus("copy-canceled");
    };

    const handleRemoveTracker = () => onRemove(eventId);

    const handleRemoveTrackerAndDeleteCopiedFile = () => {
        handleRemoveTracker();

        removeRaw(to + sep + filename).catch(error => console.error(error));
    };

    useEffect(() => {
        mountListeners().then(togglePause);

        const handleKeyDown = (e: KeyboardEvent) => {
            if (!e.altKey) {
                return;
            }

            e.preventDefault();

            switch (e.code) {
                case "KeyA":
                    return setStatus("waiting-action");
                case "KeyP":
                    return setStatus("preparing");
                case "KeyC":
                    return setStatus("copying");
                case "KeyS":
                    return setStatus("copy-canceled");
            }
        };

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div ref={trackerRef} data-waiting-action={status === "waiting-action"} className={styles.wrapper}>
            <div className={styles.info}>
                {status !== "copy-canceled" ? (
                    <>
                        {status === "preparing" ? (
                            <p className={styles.text}>Preparing to copy folder</p>
                        ) : (
                            <p title={`Copying ${filename} from ${from} to ${to}`} className={styles.text}>
                                {action === "copy" ? "Copying" : "Moving"} {filename} from {from} to {to}
                            </p>
                        )}

                        <div className={styles.buttons}>
                            <button type="button" onClick={togglePause}>
                                {paused ? <PlaySVG /> : <PauseSVG />}
                            </button>
                            <button type="button" onClick={handleTerminateAction}>
                                <CloseSVG strokeWidth={2} width={14} height={14} />
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <p title="Delete copied file?" className={styles.text}>
                            Delete copied file?
                        </p>

                        <div className={styles.buttons}>
                            <button type="button" onClick={handleRemoveTrackerAndDeleteCopiedFile}>
                                <CheckMarkSVG />
                            </button>
                            <button type="button" onMouseDown={handleRemoveTracker}>
                                <CloseSVG strokeWidth={2} width={14} height={14} />
                            </button>
                        </div>
                    </>
                )}
            </div>

            {status === "waiting-action" && (
                <button className={styles.copyProblemDisplayer} onClick={e => console.warn(e)}>
                    Action required
                </button>
            )}
        </div>
    );
};

export default FolderCopyingTracker;
