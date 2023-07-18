import React, { useCallback, useEffect, useRef, useState } from "react";
import { sep } from "@tauri-apps/api/path";
import { appWindow } from "@tauri-apps/api/window";
import { UnlistenFn } from "@tauri-apps/api/event";

import { removeCopyProcessFromState, removeRaw } from "@tauriAPI";
import { PlaySVG, PauseSVG, CloseSVG, CheckMarkSVG } from "@assets";

import styles from "./Tracker.module.scss";

type TrackerProps = CustomEventMap["startTrackingClipboardAction"]["detail"] & {
    onRemove: (id: number) => void;
};

const Tracker: React.FC<TrackerProps> = ({ eventId, filename, from, to, onRemove }) => {
    const [paused, setPaused] = useState(true);
    const [askDelete, setAskDelete] = useState(false);

    const trackerRef = useRef<HTMLDivElement | null>(null);
    const untrack = useRef<{
        progress: UnlistenFn;
        finished: UnlistenFn;
    } | null>(null);

    const mountListeners = useCallback(async () => {
        // const u1 = await appWindow.listen(`copy-started//${eventId}`, e => console.log(e));
        const progress = await appWindow.listen<{ done: number; total: number }>(`copy-progress//${eventId}`, e => {
            trackerRef.current?.style.setProperty("--action-progress", (e.payload.done / e.payload.total) * 100 + "%");
        });

        const finished = await appWindow.once(`copy-finished//${eventId}`, () => {
            removeCopyProcessFromState(eventId);

            onRemove(eventId);

            untrack.current?.progress();
        });

        untrack.current = { progress, finished };
    }, [eventId, onRemove]);

    const handleTerminateAction = () => {
        appWindow.emit(`copy-change-state//${eventId}`, "exit");

        setTimeout(() => setAskDelete(true));
    };

    const togglePause = useCallback(() => {
        setPaused(prev => {
            appWindow.emit(`copy-change-state//${eventId}`, prev ? "run" : "pause");

            return !prev;
        });
    }, [eventId]);

    const handleRemoveTracker = () => {
        untrack.current?.progress();
        untrack.current?.finished();

        onRemove(eventId);
    };

    const handleRemoveTrackerAndDeleteCopiedFile = () => {
        handleRemoveTracker();

        removeRaw(to + sep + filename).catch(error => console.error(error));
    };

    useEffect(() => {
        mountListeners().then(togglePause);
    }, [eventId, togglePause, mountListeners]);

    return (
        <div ref={trackerRef} className={styles.wrapper}>
            {!askDelete ? (
                <>
                    <p title={`Copying ${filename} from ${from} to ${to}`} className={styles.text}>
                        Copying {filename} from {from} to {to}
                    </p>

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
                        <button type="button" onClick={handleRemoveTracker}>
                            <CloseSVG strokeWidth={2} width={14} height={14} />
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default Tracker;
