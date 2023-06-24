import React, { useEffect, useRef, useState } from 'react';

import { CTXTypes, DataSetKeys } from '../../utils';

import styles from "./ContextMenu.module.scss";

type ContextMenuProps = {
    targetRef: React.RefObject<HTMLElement>
}

type ContextMenuInfo = {
    contextMenuType: string;
    coordinates: {
        x: number,
        y: number
    };

    contextMenuAdditionalInfo?: string;
} | undefined;

const ContextMenu: React.FC<ContextMenuProps> = ({ targetRef }) => {
    const [contextMenuInfo, setContextMenuInfo] = useState<ContextMenuInfo>(undefined);

    const ctxContainerRef = useRef<HTMLDivElement>(null);

    const hideCTX = (e: MouseEvent) => {
        const composedPath = e.composedPath();
        const ctxContainer = ctxContainerRef.current;

        if (ctxContainer && !composedPath.includes(ctxContainer)) {
            setContextMenuInfo(undefined);

            targetRef.current?.removeEventListener("click", hideCTX);
        }
    };

    useEffect(() => {
        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();

            let composedPath = e.composedPath() as HTMLElement[];
            const targetRefIndex = composedPath.findIndex(el => el.isEqualNode(targetRef.current));

            composedPath = composedPath.slice(0, targetRefIndex);

            const contextMenuTarget = composedPath.find(el => (el as HTMLElement)?.dataset?.contextMenuType);

            const contextMenuType = contextMenuTarget?.dataset[DataSetKeys.contextMenuType];
            const contextMenuAdditionalInfo = contextMenuTarget?.dataset[DataSetKeys.contextMenuAdditionalInfo];

            if (!contextMenuType) {
                setContextMenuInfo(undefined);

                return;
            }

            setContextMenuInfo({
                contextMenuType,
                contextMenuAdditionalInfo,
                coordinates: {
                    x: e.clientX,
                    y: e.clientY
                }
            });

            targetRef.current?.addEventListener("click", hideCTX);
        }

        targetRef.current?.addEventListener("contextmenu", handleContextMenu)

        return () => {
            targetRef.current?.removeEventListener("contextmenu", handleContextMenu)
        };
    }, []);

    if (!contextMenuInfo) {
        return;
    }

    return (
        <div
            className={styles.wrapper}
            ref={ctxContainerRef}
            style={{
                top: contextMenuInfo.coordinates.y + "px",
                left: contextMenuInfo.coordinates.x + "px"
            }}
        >Context Menu</div>
    );
}

export default ContextMenu;