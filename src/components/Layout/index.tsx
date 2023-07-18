import React from "react";

import Navbar from "../Navbar";
import FileList from "../FileList";
import WindowFrame from "../WindowFrame";
import ContextMenu from "../ContextMenu";
import NotificationList from "../NotificationList";
import ClipboardActionTrackerList from "../ClipboardActionTrackerList";

import styles from "./Layout.module.scss";

const Layout: React.FC = () => {
    return (
        <>
            <div className={styles.app}>
                <WindowFrame />

                <div className={styles.body}>
                    <Navbar />

                    <FileList />
                </div>
            </div>

            <ContextMenu />

            <div className={styles.popupZone}>
                <NotificationList />

                <ClipboardActionTrackerList />
            </div>
        </>
    );
};

export default Layout;
