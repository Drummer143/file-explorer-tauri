import React, { useCallback, useEffect, useRef } from "react";
import { sep } from "@tauri-apps/api/path";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";

import Disk from "./Disk";
import File from "./File";
import Folder from "./Folder";
import { useExplorerHistory } from "@zustand";
import { EditFileModal, FileExistModal } from "../modals";
import { useResizeObserver, useWatchPathChange } from "@hooks";
import { CTXTypes, addFileInClipboard, findActiveLayerKeys, pasteFile } from "@utils";

import styles from "./FileList.module.scss";

const FileList: React.FC = () => {
    const { currentPath } = useExplorerHistory();

    const listContainerRef = useRef<HTMLDivElement | null>(null);
    const searchPattern = useRef("");
    const gridWidth = useRef(0);
    const beforeResetPatternTimeout = useRef<NodeJS.Timeout | null>(null);

    const selectFileComponent = (file: CFile) => {
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

    const { files } = useWatchPathChange();

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;

            const canSearchFile = !document.documentElement.dataset.ctxOpened && !document.documentElement.dataset.modalOpened;

            if (findActiveLayerKeys(e, ["altKey", "metaKey", "shiftKey"]).length > 0 || !canSearchFile) {
                return;
            }

            if (e.ctrlKey) {
                switch (e.code) {
                    case "KeyX": {
                        const canMoveTarget = target.dataset.contextMenuType !== "disk";
                        const filename = target.dataset.filename;
                        const filetype = target.dataset.fileType;

                        if (!canMoveTarget || !filename || filetype !== "file" && filetype !== "folder") {
                            return;
                        }

                        addFileInClipboard({
                            dirname: currentPath,
                            filename,
                            filetype,
                            action: "cut"
                        });

                        break;
                    }
                    case "KeyC": {
                        const filename = target.dataset.filename;
                        const filetype = target.dataset.fileType;

                        if (!filename || filetype !== "file" && filetype !== "folder") {
                            return;
                        }

                        addFileInClipboard({
                            dirname: currentPath,
                            filename,
                            filetype,
                            action: "copy"
                        });

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
            } else {
                if (!listContainerRef.current) {
                    return;
                }

                if (e.code.startsWith("Key")) {
                    if (beforeResetPatternTimeout.current) {
                        clearTimeout(beforeResetPatternTimeout.current);
                    }

                    searchPattern.current += e.key;

                    Array
                        .from(listContainerRef.current.children as unknown as HTMLElement[])
                        .find(el => el.dataset.filenameLowercased?.startsWith(searchPattern.current))
                        ?.focus();

                    beforeResetPatternTimeout.current = setTimeout(() => {
                        searchPattern.current = "";
                        beforeResetPatternTimeout.current = null;
                    }, 2000);
                } else if ((document.activeElement as HTMLElement)?.dataset.filename) {
                    e.preventDefault();

                    let focusedElementIndex = Array.from(listContainerRef.current.children as unknown as HTMLElement[])
                        .findIndex(e => e.dataset.filename === (document.activeElement as HTMLElement)?.dataset.filename);

                    if (focusedElementIndex === -1) {
                        return;
                    }

                    switch (e.code) {
                        case "ArrowLeft": {
                            const modIndex = focusedElementIndex % gridWidth.current;

                            if (!modIndex) {
                                return;
                            } else {
                                focusedElementIndex--;
                            }

                            break;
                        }
                        case "ArrowRight": {
                            const modIndex = focusedElementIndex % gridWidth.current;

                            if (modIndex === gridWidth.current - 1) {
                                return;
                            } else {
                                focusedElementIndex++;
                            }

                            break;
                        }
                        case "ArrowUp":
                            focusedElementIndex -= gridWidth.current;
                            break;
                        case "ArrowDown":
                            focusedElementIndex += gridWidth.current;

                            if (focusedElementIndex >= listContainerRef.current.children.length) {
                                focusedElementIndex = listContainerRef.current.children.length - 1;
                            }
                            break;
                    }

                    (listContainerRef.current.children.item(focusedElementIndex) as HTMLElement | null)?.focus();
                }
            }
        }, [currentPath]
    );

    useEffect(() => {
        listContainerRef.current?.scrollTo({ top: 0 });
    }, [currentPath]);

    useEffect(() => {
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [handleKeyDown]);

    useResizeObserver({
        target: listContainerRef.current,
        onResize: ([e]) => {
            const itemWidth = parseInt(getComputedStyle(document.body).getPropertyValue("--file-list-item-width"));

            if (isNaN(itemWidth)) {
                return console.error("Can't get width of item in file list");
            }

            gridWidth.current = Math.floor(e.contentRect.width / itemWidth);

            listContainerRef.current?.style.setProperty("--count-of-columns", gridWidth.current.toString());
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
                    {files.map(selectFileComponent)}
                </div>
            </OverlayScrollbarsComponent>

            <EditFileModal />
            <FileExistModal />
        </>
    );
};

export default FileList;
