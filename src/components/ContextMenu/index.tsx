import React, { useEffect, useRef, useState } from "react";

import FileContextMenu from "./FileContextMenu";
import ExplorerContextMenu from "./ExplorerContextMenu";

import styles from "./ContextMenu.module.scss";

type ContextMenuInfo =
    | {
          CTXComponent: React.ReactNode;
          opacity: 0 | 1;
          coordinates: {
              x: number;
              y: number;
          };
      }
    | undefined;

const ContextMenu: React.FC = () => {
    const [contextMenuInfo, setContextMenuInfo] = useState<ContextMenuInfo>(undefined);

    const ctxContainerRef = useRef<HTMLDivElement>(null);

    const selectContextMenu = (ctxTarget: HTMLElement) => {
        const contextMenuType = ctxTarget.dataset.contextMenuType;
        const filename = ctxTarget.dataset.filename;

        // TODO:
        switch (contextMenuType) {
            case "file":
            case "disk":
            case "folder":
                if (filename) {
                    return <FileContextMenu ctxTarget={ctxTarget} />;
                } else {
                    return <></>;
                }
            case "explorer":
                return <ExplorerContextMenu />;
        }
    };

    const closeCTX = () => {
        setContextMenuInfo(undefined);

        document.documentElement.removeAttribute("data-ctx-opened");

        document.removeEventListener("click", closeCTXOnOuterClick);
        window.removeEventListener("resize", closeCTX);
    };

    const closeCTXOnOuterClick = (e: MouseEvent) => {
        const composedPath = e.composedPath();
        const ctxContainer = ctxContainerRef.current;

        if (ctxContainer && !composedPath.includes(ctxContainer)) {
            closeCTX();
        }
    };

    useEffect(() => {
        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();

            const composedPath = e.composedPath() as HTMLElement[];
            const contextMenuTarget = composedPath.find(el => (el as HTMLElement)?.dataset?.contextMenuType);
            let CTXComponent: JSX.Element | undefined;

            if (contextMenuTarget) {
                CTXComponent = selectContextMenu(contextMenuTarget as HTMLElement);
            }

            if (!CTXComponent) {
                return setContextMenuInfo(undefined);
            }

            document.documentElement.dataset.ctxOpened = "true";

            setContextMenuInfo({
                CTXComponent,
                opacity: 0,
                coordinates: {
                    x: e.clientX,
                    y: e.clientY
                }
            });

            document.addEventListener("click", closeCTXOnOuterClick);
            window.addEventListener("resize", closeCTX);
        };

        document.addEventListener("contextmenu", handleContextMenu);

        return () => {
            document.removeEventListener("contextmenu", handleContextMenu);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!contextMenuInfo || contextMenuInfo.opacity) {
            return;
        }

        const boundingRect = ctxContainerRef.current?.getBoundingClientRect();

        if (!boundingRect) {
            return;
        }

        const { bottom, right, width, height } = boundingRect;
        let { x, y } = contextMenuInfo.coordinates;

        if (document.body.clientWidth < right) {
            x -= width;
        }

        if (document.body.clientHeight < bottom) {
            y -= height;
        }

        setContextMenuInfo(prev => ({
            CTXComponent: prev?.CTXComponent,
            opacity: 1,
            coordinates: {
                x,
                y
            }
        }));
    }, [contextMenuInfo]);

    return (
        <div
            className={styles.wrapper}
            ref={ctxContainerRef}
            onClick={closeCTX}
            style={
                contextMenuInfo
                    ? {
                          top: contextMenuInfo.coordinates.y + "px",
                          left: contextMenuInfo.coordinates.x + "px",
                          opacity: !contextMenuInfo.opacity ? 0 : undefined
                      }
                    : {
                          display: "none"
                      }
            }
        >
            {!!contextMenuInfo && contextMenuInfo.CTXComponent}
        </div>
    );
};

export default ContextMenu;
