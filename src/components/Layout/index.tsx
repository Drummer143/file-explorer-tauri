import React from "react";

import Navbar from "../Navbar";
import FileList from "../FileList";
import WindowFrame from "../WindowFrame";
import ContextMenu from "../ContextMenu";
import NotificationList from "../NotificationList";

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
            <NotificationList />
        </>
    );
};

export default Layout;
