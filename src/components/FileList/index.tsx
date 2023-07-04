import React, { useCallback, useEffect, useRef } from "react";

import Disk from "./Disk";
import File from "./File";
import Folder from "./Folder";
import { CTXTypes } from "../../utils";
import { EditFileModal } from "./../modals/";
import { useExplorerHistory } from "../../zustand";
import { useResizeObserver, useWatchPathChange } from "../../hooks";

import styles from "./FileList.module.scss";
import { sep } from "@tauri-apps/api/path";

const FileList: React.FC = () => {
    const { currentPath } = useExplorerHistory();

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
        const canMoveTarget = target.dataset.contextMenuType !== "disk";
        const filename = target.dataset.contextMenuAdditionalInfo;

        if (!e.ctrlKey && !target) {
            return;
        }

        switch (e.code) {
            case "KeyX":
                document.querySelector<HTMLElement>(".cut-file")?.classList.remove("cut-file");

                if (canMoveTarget && filename) {
                    document.documentElement.dataset.copiedFile = currentPath + sep + filename;
                    document.documentElement.dataset.clipboardAction = "cut";
                    target.classList.add("cut-file");
                }

                break;
            case "KeyC":
                document.querySelector<HTMLElement>(".cut-file")?.classList.remove("cut-file");

                if (canMoveTarget && filename) {
                    document.documentElement.dataset.copiedFile = currentPath + sep + filename;
                    document.documentElement.dataset.clipboardAction = "copy";
                }
                break;
            case "KeyV": {
                const { copiedFile, clipboardAction } = document.documentElement.dataset;

                if (!copiedFile || !clipboardAction) {
                    return;
                }

                if (clipboardAction === "copy") {
                    console.log(`pasting "${copiedFile} to ${currentPath}`);
                } else {
                    console.log(`moving "${copiedFile} to ${currentPath}`);

                    document.documentElement.dataset.copiedFile = undefined;
                    document.documentElement.dataset.clipboardAction = undefined;
                }
            }

        }
    }, [currentPath]);

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
