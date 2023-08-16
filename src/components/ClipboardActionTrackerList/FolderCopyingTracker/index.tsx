import React, { useEffect, useRef, useState } from "react";
import { appWindow } from "@tauri-apps/api/window";
import { UnlistenFn } from "@tauri-apps/api/event";

import { removeCopyProcessFromState } from "@tauriAPI";
import { PlaySVG, PauseSVG, CloseSVG } from "@assets";

import styles from "./FolderCopyingTracker.module.scss";

type CopyStatus = "preparing" | "waiting-action" | "copying";

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
    const [isErrorMessageVisible, setIsErrorMessageVisible] = useState(false);
    const [errorFilename, setErrorFilename] = useState<string | undefined>(undefined);

    const trackerRef = useRef<HTMLDivElement | null>(null);
    const doActionForAllDuplicates = useRef(false);
    const untrack = useRef<{
        progress: UnlistenFn;
        preparing: UnlistenFn;
        error: UnlistenFn;
        finished: UnlistenFn;
    } | null>(null);

    const mountListeners = async () => {
        const preparing = await appWindow.once(`copy-ready//${eventId}`, () => {
            setStatus("copying");
        });

        const progress = await appWindow.listen<{ done: number; total: number }>(`copy-progress//${eventId}`, e => {
            trackerRef.current?.style.setProperty("--action-progress", (e.payload.done / e.payload.total) * 100 + "%");
        });

        const error = await appWindow.listen<{ filename: string }>(`copy-error//${eventId}`, e => {
            setStatus("waiting-action");
            setErrorFilename(e.payload.filename);
        });

        const finished = await appWindow.once(`copy-finished//${eventId}`, () => {
            removeCopyProcessFromState(eventId);

            onRemove(eventId);

            untrack.current?.progress();
            untrack.current?.preparing();
            untrack.current?.error();
        });

        untrack.current = { progress, finished, preparing, error };
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
        untrack.current?.error();
        untrack.current?.preparing();

        appWindow.emit(`copy-change-state//${eventId}`, "exit");

        onRemove(eventId);
    };

    const handleToggleErrorMessage = () => {
        setIsErrorMessageVisible(prev => !prev);
    };

    const handleErrorButtonClick = (action: "Overwrite" | "SaveBoth" | "Skip") => {
        appWindow.emit(`copy-handle-duplicate//${eventId}`, {
            action,
            // eslint-disable-next-line camelcase
            do_for_all: doActionForAllDuplicates.current
        });

        setIsErrorMessageVisible(false);
        setErrorFilename(undefined);
        setStatus("copying");
        setPaused(false);
    };

    const handleCheckboxChange: React.ChangeEventHandler<HTMLInputElement> = e => {
        doActionForAllDuplicates.current = e.target.checked;
    }

    useEffect(() => {
        mountListeners().then(togglePause);

        return () => {
            untrack.current?.error();
            untrack.current?.finished();
            untrack.current?.preparing();
            untrack.current?.progress();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (status !== "waiting-action") {
            setIsErrorMessageVisible(true);
        }
    }, [status]);

    return (    // TODO: LOCALIZATION
        <div
            ref={trackerRef}
            data-waiting-action={status === "waiting-action"}
            className={styles.wrapper + (errorFilename ? ` ${styles.error}` : "")}
        >
            <div className={styles.info}>
                {status === "preparing" ? (
                    <p className={styles.text}>Preparing to copy folder</p>
                ) : status === "copying" || !isErrorMessageVisible ? (
                    <p
                        title={`Copying ${filename} from ${from} to ${to}`}
                        onClick={handleToggleErrorMessage}
                        className={styles.text}
                    >
                        {(paused || status === "waiting-action") && "[PAUSED]"} {action === "copy" ? "Copying" : "Moving"} {filename} from {from} to {to}
                    </p>
                ) : (
                    <p className={styles.text} onClick={handleToggleErrorMessage} title="Action required">
                        Action required
                    </p>
                )}

                <div className={styles.buttons}>
                    <button type="button" onClick={togglePause} disabled={status === "waiting-action"}>
                        {paused ? <PlaySVG /> : <PauseSVG />}
                    </button>
                    <button type="button" onClick={handleTerminateAction}>
                        <CloseSVG strokeWidth={2} width={14} height={14} />
                    </button>
                </div>
            </div>

            {isErrorMessageVisible && errorFilename && (
                <div className={styles.errorBody}>
                    <p>{errorFilename} is already exists. choose action:</p>

                    <button type="button" onClick={() => handleErrorButtonClick("Overwrite")}>overwrite</button>
                    <button type="button" onClick={() => handleErrorButtonClick("SaveBoth")}>save both</button>
                    <button type="button" onClick={() => handleErrorButtonClick("Skip")}>skip file</button>

                    <label className={styles.doForAllLabel}>
                        <input type="checkbox" onChange={handleCheckboxChange} />
                        <p>Do this for all files</p>
                    </label>
                </div>
            )}
        </div>
    );
};

export default FolderCopyingTracker;
