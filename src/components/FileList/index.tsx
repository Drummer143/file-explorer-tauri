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
    const { currentPath, prevTargetFile } = useExplorerHistory();

    const listContainerRef = useRef<HTMLDivElement | null>(null);
    const searchPattern = useRef("");
    const gridWidth = useRef(0);
    const beforeResetFileSearchTimeout = useRef<NodeJS.Timeout | null>(null);

    const { files } = useWatchPathChange();

    const selectFileComponent = (file: CFile) => {
        switch (file.type) {
            case "disk":
                return <Disk initialFocus={prevTargetFile === file.mountPoint} key={currentPath + file.mountPoint} {...file} />;
            case "folder":
                return <Folder initialFocus={prevTargetFile === file.name} key={currentPath + file.name} {...file} />;
            case "file":
                return <File key={currentPath + file.name} {...file} />;
            default:
                console.error("unhandled file", file);
        }
    };

    const handleKeyDownWithCtrlKey = useCallback((e: KeyboardEvent) => {
        const target = e.target as HTMLElement;

        switch (e.code) {
            case "KeyX": {
                const canMoveTarget = target.dataset.contextMenuType !== "disk";
                const filename = target.dataset.filename;
                const filetype = target.dataset.fileType;

                if (!canMoveTarget || !filename || (filetype !== "file" && filetype !== "folder")) {
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

                if (!filename || (filetype !== "file" && filetype !== "folder")) {
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
    }, [currentPath]);

    const handleSearchItem = useCallback((e: KeyboardEvent) => {
        if (beforeResetFileSearchTimeout.current) {
            clearTimeout(beforeResetFileSearchTimeout.current);
        }

        searchPattern.current += e.key;

        Array.from(listContainerRef.current?.children as unknown as HTMLElement[])
            .find(el => el.dataset.filenameLowercased?.startsWith(searchPattern.current))
            ?.focus();

        beforeResetFileSearchTimeout.current = setTimeout(() => {
            searchPattern.current = "";
            beforeResetFileSearchTimeout.current = null;
        }, 2000);
    }, []);

    const handleListArrowNavigation = useCallback((e: KeyboardEvent) => {
        if (!listContainerRef.current) {
            return;
        }

        e.preventDefault();

        let focusedElementIndex = Array.from(
            listContainerRef.current.children as unknown as HTMLElement[]
        ).findIndex(e => e.dataset.filename === (document.activeElement as HTMLElement)?.dataset.filename);

        if (focusedElementIndex === -1) {
            return (listContainerRef.current.children.item(0) as HTMLElement | null)?.focus();
        }

        switch (e.code) {
            case "ArrowLeft": {
                focusedElementIndex--;
                break;
            }
            case "ArrowRight": {
                if (focusedElementIndex === listContainerRef.current.children.length - 1) {
                    return;
                }

                focusedElementIndex++;

                if (focusedElementIndex >= listContainerRef.current.children.length) {
                    focusedElementIndex = listContainerRef.current.children.length - gridWidth.current;
                }

                break;
            }
            case "ArrowUp":
                focusedElementIndex -= gridWidth.current;
                break;
            case "ArrowDown": {
                const modIndex = listContainerRef.current.children.length % gridWidth.current;

                focusedElementIndex += gridWidth.current;

                if (modIndex && focusedElementIndex >= listContainerRef.current.children.length) {
                    focusedElementIndex = listContainerRef.current.children.length - 1;
                }
                break;
            }
        }

        (listContainerRef.current.children.item(focusedElementIndex) as HTMLElement | null)?.focus();
    }, []);

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            const isHandlePossible =
                !document.documentElement.dataset.ctxOpened && !document.documentElement.dataset.modalOpened;

            if (findActiveLayerKeys(e, ["altKey", "metaKey", "shiftKey"]).length > 0 || !isHandlePossible) {
                return;
            }

            if (e.ctrlKey) {
                handleKeyDownWithCtrlKey(e);
            } else {
                const isBodyFocused = document.activeElement?.isSameNode(document.body);
                const isFileItemFocused = (document.activeElement as HTMLElement)?.dataset.filename;

                if (isBodyFocused && e.code.startsWith("Key")) {
                    handleSearchItem(e);
                } else if ((isBodyFocused || isFileItemFocused) && e.code.startsWith("Arrow")) {
                    handleListArrowNavigation(e);
                }
            }
        },
        [handleKeyDownWithCtrlKey, handleListArrowNavigation, handleSearchItem]
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
