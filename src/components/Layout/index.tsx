import React from "react";

import Navbar from "../Navbar";
import FileList from "../FileList";
import WindowFrame from "../WindowFrame";
import ContextMenu from "../ContextMenu";
import ErrorBoundary from "../ErrorBoundary";
import NotificationList from "../NotificationList";
import MainFallbackScreen from "../../errorFallbackScreens/MainFallback";
import ClipboardActionTrackerList from "../ClipboardActionTrackerList";

import styles from "./Layout.module.scss";

const Layout: React.FC = () => {
    return (
        <div className={styles.app}>
            <WindowFrame />

            <ErrorBoundary fallback={MainFallbackScreen}>
                <div className={styles.body}>
                    <Navbar />

                    <FileList />
                </div>

                <ContextMenu />

                <div className={styles.popupZone}>
                    <NotificationList />

                    <ClipboardActionTrackerList />
                </div>
            </ErrorBoundary>
        </div>
    );
};

export default Layout;
