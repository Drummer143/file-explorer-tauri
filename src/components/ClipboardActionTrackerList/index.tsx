import React, { useEffect, useState } from "react";

import FileCopyingTracker from "./FileCopyingTracker";
import FolderCopyingTracker from "./FolderCopyingTracker";

import styles from "./ClipboardActionTrackerList.module.scss";
import MultipleFilesTracker from "./MultipleFilesTracker";

type Trackers = StartTrackingClipboardActionDetail[];

const ClipboardActionTrackerList: React.FC = () => {
    const [trackers, setTrackers] = useState<Trackers>([]);

    const handleRemoveTracker = (id: number) => setTrackers(prev => prev.filter(t => t.eventId !== id));

    const selectTracker = (t: CustomEventMap["startTrackingClipboardAction"]["detail"]) => {
        switch (t.type) {
            case "file":
                return <FileCopyingTracker key={t.eventId} {...t} onRemove={handleRemoveTracker} />;
            case "folder":
                return <FolderCopyingTracker key={t.eventId} {...t} onRemove={handleRemoveTracker} />;
            case "multiple":
                return <MultipleFilesTracker key={t.eventId} {...t} onRemove={handleRemoveTracker} />;
        }
    };

    useEffect(() => {
        const handleAddTracker: DocumentEventHandler<"startTrackingClipboardAction"> = e => {
            setTrackers(prev => prev.concat(e.detail));
        };

        document.addEventListener("startTrackingClipboardAction", handleAddTracker);

        return () => {
            document.removeEventListener("startTrackingClipboardAction", handleAddTracker);
        };
    }, []);

    return <div className={styles.wrapper}>{trackers.map(selectTracker)}</div>;
};

export default ClipboardActionTrackerList;
