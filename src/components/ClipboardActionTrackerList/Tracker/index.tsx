import React, { useEffect, useRef, useState } from "react";
import { sep } from "@tauri-apps/api/path";
import { appWindow } from "@tauri-apps/api/window";
import { UnlistenFn } from "@tauri-apps/api/event";

import { removeCopyProcessFromState, removeRaw } from "@tauriAPI";
import { PlaySVG, PauseSVG, CloseSVG, CheckMarkSVG } from "@assets";

import styles from "./Tracker.module.scss";

type TrackerProps = StartTrackingClipboardActionDetail & {
    onRemove: (id: number) => void;
};

const Tracker: React.FC<TrackerProps> = ({ eventId, filename, from, to, onRemove, action }) => {
    const [paused, setPaused] = useState(true);
    const [askDelete, setAskDelete] = useState(false);

    const trackerRef = useRef<HTMLDivElement | null>(null);
    const untrack = useRef<{
        progress: UnlistenFn;
        finished: UnlistenFn;
    } | null>(null);

    const mountListeners = async () => {
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

        setTimeout(() => setAskDelete(true));
    };

    const handleRemoveTracker = () => onRemove(eventId);

    const handleRemoveTrackerAndDeleteCopiedFile = () => {
        handleRemoveTracker();

        removeRaw(to + sep + filename).catch(error => console.error(error));
    };

    useEffect(() => {
        mountListeners().then(togglePause);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div ref={trackerRef} className={styles.wrapper}>
            {!askDelete ? (
                <>
                    <p title={`Copying ${filename} from ${from} to ${to}`} className={styles.text}>
                        {action === "copy" ? "Copying" : "Moving"} {filename} from {from} to {to}
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
                        <button type="button" onMouseDown={handleRemoveTracker}>
                            <CloseSVG strokeWidth={2} width={14} height={14} />
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default Tracker;
