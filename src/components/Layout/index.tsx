import { useRef } from "react";
import { Outlet } from "react-router-dom";

import Navbar from "../Navbar";
import WindowFrame from "../WindowFrame";
import ContextMenu from "../ContextMenu";

import styles from "./Layout.module.scss";

const Layout: React.FC = () => {
    const layoutRef = useRef<HTMLDivElement>(null);

    return (
        <>
            <div ref={layoutRef} className={styles.app}>
                <WindowFrame />

                <div className={styles.body}>
                    <Navbar />

                    <Outlet />
                </div>
            </div>

            <ContextMenu targetRef={layoutRef} />
        </>
    );
}

export default Layout;
