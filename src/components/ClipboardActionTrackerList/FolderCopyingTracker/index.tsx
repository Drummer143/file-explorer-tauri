import React, { useCallback, useEffect, useRef, useState } from "react";
import { appWindow } from "@tauri-apps/api/window";
import { UnlistenFn } from "@tauri-apps/api/event";
import { useTranslation } from "react-i18next";

import { removeCopyProcessFromState } from "@tauriAPI";
import { PlaySVG, PauseSVG, CloseSVG } from "@assets";

import styles from "./FolderCopyingTracker.module.scss";

type CopyStatus = "preparing" | "waiting-action" | "copying" | "paused";

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
    const { t } = useTranslation("translation", { keyPrefix: "" });

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

    const mountListeners = useCallback(async () => {
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
    }, [eventId, onRemove]);

    const togglePause = useCallback(() => {
        setStatus(prev => {
            appWindow.emit(`copy-change-state//${eventId}`, prev === "paused" ? "run" : "pause");

            return prev === "paused" ? "copying" : "paused";
        });
    }, [eventId]);

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
    };

    const handleCheckboxChange: React.ChangeEventHandler<HTMLInputElement> = e => {
        doActionForAllDuplicates.current = e.target.checked;
    };

    useEffect(() => {
        mountListeners().then(togglePause);

        return () => {
            untrack.current?.error();
            untrack.current?.finished();
            untrack.current?.preparing();
            untrack.current?.progress();
        };
    }, [mountListeners, togglePause]);

    useEffect(() => {
        if (status !== "waiting-action") {
            setIsErrorMessageVisible(true);
        }
    }, [status]);

    return (
        <div ref={trackerRef} className={styles.wrapper.concat(errorFilename ? ` ${styles.error}` : "")}>
            <div className={styles.info}>
                {status === "preparing" ? (
                    <p title={t("preparingToCopyFolder")} className={styles.text}>
                        {t("preparingToCopyFolder")}
                    </p>
                ) : status === "copying" || isErrorMessageVisible ? (
                    <p
                        title={t(action === "copy" ? "copyingFileFromTo" : "movingFileFromTo", { filename, from, to })}
                        onClick={handleToggleErrorMessage}
                        className={styles.text}
                    >
                        {["paused", "waiting-action"].includes(status) && "[PAUSED]"}{" "}
                        {t(action === "copy" ? "copyingFileFromTo" : "movingFileFromTo", { filename, from, to })}
                    </p>
                ) : (
                    <p className={styles.text} onClick={handleToggleErrorMessage} title={t("actionRequired")}>
                        {t("actionRequired")}
                    </p>
                )}

                <div className={styles.buttons}>
                    <button
                        type="button"
                        title={status === "paused" ? t("pause") : t("continue")}
                        onClick={togglePause}
                        disabled={["preparing", "waiting-action"].includes(status)}
                    >
                        {status === "copying" ? <PlaySVG /> : <PauseSVG />}
                    </button>

                    <button type="button" title={t("cancel")} onClick={handleTerminateAction}>
                        <CloseSVG strokeWidth={2} width={14} height={14} />
                    </button>
                </div>
            </div>

            {isErrorMessageVisible && errorFilename && (
                <div className={styles.errorBody}>
                    <p>{t("alreadyExists", { filename: errorFilename })}</p>

                    <button type="button" title={t("overwrite")} onClick={() => handleErrorButtonClick("Overwrite")}>
                        {t("overwrite")}
                    </button>
                    <button type="button" title={t("saveBoth")} onClick={() => handleErrorButtonClick("SaveBoth")}>
                        {t("saveBoth")}
                    </button>
                    <button type="button" title={t("skipFile")} onClick={() => handleErrorButtonClick("Skip")}>
                        {t("skipFile")}
                    </button>

                    <label className={styles.doForAllLabel}>
                        <input type="checkbox" onChange={handleCheckboxChange} />
                        <p>{t("doThisForAllFiles")}</p>
                    </label>
                </div>
            )}
        </div>
    );
};

export default FolderCopyingTracker;
