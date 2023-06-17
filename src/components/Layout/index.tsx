import { Outlet } from "react-router-dom";

import WindowFrame from "../WindowFrame";

import styles from "./Layout.module.scss";

const Layout: React.FC = () => {
    return (
        <div className={styles.app}>
            <WindowFrame />

            <div className={styles.body}>
                <Outlet />
            </div>
        </div>
    );
}

export default Layout;
