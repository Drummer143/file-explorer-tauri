import React, { useCallback, useEffect, useRef } from "react";
import { sep } from "@tauri-apps/api/path";

import Disk from "./Disk";
import File from "./File";
import Folder from "./Folder";
import { EditFileModal } from "./../modals/";
import { useExplorerHistory } from "../../zustand";
import { CTXTypes, copyFile, cutFile } from "../../utils";
import { useResizeObserver, useWatchPathChange, usePasteFile } from "../../hooks";

import styles from "./FileList.module.scss";

const FileList: React.FC = () => {
    const { currentPath } = useExplorerHistory();

    const pasteFile = usePasteFile();

    const listContainerRef = useRef<HTMLDivElement>(null);

    const mapFiles = (file: CFile) => {
        switch (file.type) {
            case "disk":
                return <Disk key={file.mountPoint} {...file} />;
            case "folder":
                return <Folder key={file.name} {...file} />;
            case "file":
            case "image":
                return <File key={file.name} {...file} />;
            default:
                console.error("unhandled file", file);
        }
    };

    const { files } = useWatchPathChange();

    const handleCopyCutPasteFile = useCallback((e: KeyboardEvent) => {
        const target = e.target as HTMLElement;

        if (!e.ctrlKey || !target) {
            return;
        }

        switch (e.code) {
            case "KeyX": {
                const canMoveTarget = target.dataset.contextMenuType !== "disk";
                const filename = target.dataset.contextMenuAdditionalInfo;

                if (canMoveTarget && filename) {
                    cutFile(currentPath, filename);
                }
                break;
            }
            case "KeyC": {
                const filename = target.dataset.contextMenuAdditionalInfo;

                if (filename) {
                    copyFile(currentPath + sep + filename);
                }

                break;
            }
            case "KeyV": {
                let to = currentPath;
                const possibleFocusedFileName = (document.activeElement as HTMLElement | null)?.dataset.contextMenuAdditionalInfo;

                if (possibleFocusedFileName) {
                    to = to + sep + possibleFocusedFileName;
                }

                pasteFile(to);
            }
        }
    }, [currentPath, pasteFile]);

    useEffect(() => {
        document.addEventListener("keydown", handleCopyCutPasteFile);

        return () => {
            document.removeEventListener("keydown", handleCopyCutPasteFile);
        };
    }, [handleCopyCutPasteFile]);

    useResizeObserver({
        target: listContainerRef.current,
        onResize: ([e]) => {
            const itemWidth = parseInt(getComputedStyle(document.body).getPropertyValue("--file-list-item-width"));

            if (isNaN(itemWidth)) {
                return console.error("Can't get width of item in file list");
            }

            const countOfColumns = Math.floor(e.contentRect.width / itemWidth);

            listContainerRef.current?.style.setProperty("--count-of-columns", countOfColumns.toString());
        }
    });

    return (
        <>
            <div
                ref={listContainerRef}
                className={styles.wrapper}
                data-context-menu-type={CTXTypes.explorer}
            >
                {files.map(mapFiles)}
            </div>

            <EditFileModal />
        </>
    );
};

export default FileList;
