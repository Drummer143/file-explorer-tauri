import React, { useEffect, useState } from "react";

import Tracker from "./Tracker";

import styles from "./ClipboardActionTrackerList.module.scss";

const ClipboardActionTrackerList: React.FC = () => {
    const [trackers, setTrackers] = useState<CustomEventMap["startTrackingClipboardAction"]["detail"][]>([]);

    const handleRemoveTracker = (id: number) => setTrackers(prev => prev.filter(t => t.eventId !== id));

    useEffect(() => {
        const handleAddTracker: CustomEventHandler<"startTrackingClipboardAction"> = e => {
            setTrackers(prev => prev.concat(e.detail));
        };

        document.addEventListener("startTrackingClipboardAction", handleAddTracker);
        
        return () => {
            document.removeEventListener("startTrackingClipboardAction", handleAddTracker);
        };
    }, []);

    return (
        <div className={styles.wrapper}>
            {trackers.map(t => (
                <Tracker key={t.eventId} {...t} onRemove={handleRemoveTracker} />
            ))}
        </div>
    );
};

export default ClipboardActionTrackerList;