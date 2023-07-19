import React, { useCallback, useEffect, useRef } from "react";
import { sep } from "@tauri-apps/api/path";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";

import Disk from "./Disk";
import File from "./File";
import Folder from "./Folder";
import { useExplorerHistory } from "@zustand";
import { CTXTypes, addFileInClipboard } from "@utils";
import { EditFileModal, FileExistModal } from "../modals";
import { useResizeObserver, useWatchPathChange, usePasteFile } from "@hooks";

import styles from "./FileList.module.scss";

const FileList: React.FC = () => {
    const { currentPath } = useExplorerHistory();

    const pasteFile = usePasteFile();

    const listContainerRef = useRef<HTMLDivElement | null>(null);

    const mapFiles = (file: CFile) => {
        switch (file.type) {
            case "disk":
                return <Disk key={file.mountPoint} {...file} />;
            case "folder":
                return <Folder key={file.name} {...file} />;
            case "file":
                return <File key={file.name} {...file} />;
            default:
                console.error("unhandled file", file);
        }
    };

    const { files } = useWatchPathChange({
        onBeforeChange: () => {
            listContainerRef.current?.parentElement?.scrollTo({ top: 0 });
        }
    });

    const handleCopyCutPasteFile = useCallback(
        (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;

            if (!e.ctrlKey || !target) {
                return;
            }

            switch (e.code) {
                case "KeyX": {
                    const canMoveTarget = target.dataset.contextMenuType !== "disk";
                    const filename = target.dataset.filename;
                    const filetype = target.dataset.fileType;

                    if (canMoveTarget && filename && filetype) {
                        addFileInClipboard(currentPath + sep + filename, filename, filetype, "cut");
                    }

                    break;
                }
                case "KeyC": {
                    const filename = target.dataset.filename;
                    const filetype = target.dataset.fileType;

                    if (filename && filetype) {
                        addFileInClipboard(currentPath + sep + filename, filename, filetype, "copy");
                    }

                    break;
                }
                case "KeyV": {
                    let to = currentPath;
                    const possibleFocusedFileName = (document.activeElement as HTMLElement | null)?.dataset
                        .contextMenuAdditionalInfo;
                    const isNotFile =
                        (document.activeElement as HTMLElement | null)?.dataset.contextMenuType !== "file";

                    if (possibleFocusedFileName && isNotFile) {
                        to = to + sep + possibleFocusedFileName;
                    }

                    pasteFile({ dirname: to });
                }
            }
        },
        [currentPath, pasteFile]
    );

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
            <OverlayScrollbarsComponent
                element="div"
                defer
                data-file-list-scrollbar
                options={{
                    overflow: {
                        x: "hidden"
                    },
                    scrollbars: {
                        autoHide: "leave",
                        autoHideDelay: 150
                    }
                }}
            >
                <div
                    ref={listContainerRef}
                    className={styles.wrapper}
                    data-context-menu-type={CTXTypes.explorer}
                    data-readonly={currentPath ? "" : true}
                >
                    {files.map(mapFiles)}
                </div>
            </OverlayScrollbarsComponent>

            <EditFileModal />
            <FileExistModal />
        </>
    );
};

export default FileList;
