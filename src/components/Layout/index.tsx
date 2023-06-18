import { Outlet } from "react-router-dom";

import WindowFrame from "../WindowFrame";

import styles from "./Layout.module.scss";
import Navbar from "../Navbar";

const Layout: React.FC = () => {
    return (
        <div className={styles.app}>
            <WindowFrame />

            <div className={styles.body}>
                <Navbar />

                <Outlet />
            </div>
        </div>
    );
}

export default Layout;
