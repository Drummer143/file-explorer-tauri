import React from "react";
import { Outlet } from "react-router-dom";

import Navbar from "../Navbar";
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

                    <Outlet />
                </div>
            </div>

            <ContextMenu />
            <NotificationList />
        </>
    );
};

export default Layout;
