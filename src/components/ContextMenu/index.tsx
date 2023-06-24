import React, { useEffect, useRef, useState } from 'react';

import styles from "./ContextMenu.module.scss";

type ContextMenuProps = {
    targetRef: React.RefObject<HTMLElement>
}

const ContextMenu: React.FC<ContextMenuProps> = ({ targetRef }) => {
    const [menuCoords, setMenuCoords] = useState<{ x: number, y: number } | undefined>(undefined);

    const ctxContainerRef = useRef<HTMLDivElement>(null);

    const hideCTX = (e: MouseEvent) => {
        const composedPath = e.composedPath();
        const ctxContainer = ctxContainerRef.current;

        if (ctxContainer && !composedPath.includes(ctxContainer)) {
            setMenuCoords(undefined);

            targetRef.current?.removeEventListener("click", hideCTX);
        }
    };

    useEffect(() => {
        targetRef.current?.addEventListener("contextmenu", e => {
            e.preventDefault();

            setMenuCoords({
                x: e.clientX,
                y: e.clientY
            });

            targetRef.current?.addEventListener("click", hideCTX);            
        })

        return () => {
            window.oncontextmenu = null;
        };
    }, []);

    if (!menuCoords) {
        return;
    }

    return (
        <div
            className={styles.wrapper}
            ref={ctxContainerRef}
            style={{
                top: menuCoords.y + "px",
                left: menuCoords.x + "px"
            }}
        >Context Menu</div>
    );
}

export default ContextMenu;