import React, { useCallback, useEffect, useRef, useState } from "react";
import { sep } from "@tauri-apps/api/path";
import { UnlistenFn } from "@tauri-apps/api/event";
import { getCurrent } from "@tauri-apps/api/window";
import { useTranslation } from "react-i18next";

import FileCopyingTracker from "../FileCopyingTracker";
import FolderCopyingTracker from "../FolderCopyingTracker";
import { CloseSVG } from "@assets";

import styles from "./MultipleFileTracker.module.scss";

type MultipleFilesTrackerProps = Omit<StartTrackingClipboardActionDetail & { type: "multiple" }, "type"> & {
    onRemove: (eventId: number) => void;
};

const MultipleFilesTracker: React.FC<MultipleFilesTrackerProps> = ({ action, eventId, onRemove, paths }) => {
    const { t } = useTranslation("translation", { keyPrefix: "clipboardTrackers" });

    const [index, setIndex] = useState(0);
    const [fileType, setFileType] = useState<Exclude<FileTypes, "disk">>("unknown");

    const untrack = useRef<{
        fileCopied: UnlistenFn;
        allFinished: UnlistenFn;
    } | null>(null);

    const appWindow = getCurrent();

    const mountListeners = useCallback(async () => {
        appWindow.listen<[number, FileTypes]>(`copy-next-file//${eventId}`, e => {
            setTimeout(() => {
                setIndex(e.payload[0]);

                if (e.payload[1] !== "disk") {
                    setFileType(e.payload[1]);
                }
            });
        });

        appWindow.once(`copy-all-finished//${eventId}`, () => {
            untrack.current?.allFinished();

            onRemove(eventId);
        });

        appWindow.emit(`start-copying//${eventId}`);
    }, [eventId, onRemove]);

    useEffect(() => {
        mountListeners();
    }, [mountListeners]);

    return (
        <div className={styles.wrapper}>
            <div className={styles.countDisplayer}>
                <p>
                    {index + 1} of {paths.length}
                </p>

                <button>
                    <CloseSVG strokeWidth={2} width={14} height={14} />
                </button>
            </div>

            {fileType === "file" ? (
                <FileCopyingTracker
                    action={action}
                    eventId={eventId}
                    from={paths[index].from}
                    to={paths[index].to}
                    filename={paths[index].from.split(sep()).at(-1)!}
                />
            ) : fileType === "folder" ? (
                <FolderCopyingTracker
                    action={action}
                    eventId={eventId}
                    from={paths[index].from}
                    to={paths[index].to}
                    filename={paths[index].from.split(sep()).at(-1)!}
                />
            ) : (
                <div>{t("preparingToCopyFolder")}</div>
            )}
        </div>
    );
};

export default MultipleFilesTracker;
