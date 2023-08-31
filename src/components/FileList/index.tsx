/* eslint-disable max-lines */
import React, { useCallback, useEffect, useRef } from "react";
import { sep } from "@tauri-apps/api/path";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";

import Disk from "./Disk";
import File from "./File";
import Folder from "./Folder";
import SelectionArea from "../SelectionArea";
import { EditFileModal, FileExistModal } from "../modals";
import { useResizeObserver, useWatchPathChange } from "@hooks";
import { useExplorerHistory, useFilesSelectionStore } from "@zustand";
import { CTXTypes, addFileInClipboard, findActiveLayerKeys, pasteFile } from "@utils";

import styles from "./FileList.module.scss";


const FileList: React.FC = () => {
    const { currentPath, prevTargetFile } = useExplorerHistory();
    const {
        selectedItems,
        clearSelectedItems,
        setSelectedItems,
        firstSelected,
        setFirstSelected,
        getSelectedItems
    } = useFilesSelectionStore();

    const gridWidth = useRef(0);
    const searchPattern = useRef("");
    const listContainerRef = useRef<HTMLDivElement | null>(null);
    const beforeResetFileSearchTimeout = useRef<NodeJS.Timeout | null>(null);

    const { files, loading } = useWatchPathChange();

    const selectFileComponent = (file: CFile) => {
        switch (file.type) {
            case "disk":
                return (
                    <Disk
                        selected={selectedItems.includes(file.mountPoint)}
                        key={currentPath + file.mountPoint}
                        {...file}
                    />
                );
            case "folder":
                return <Folder selected={selectedItems.includes(file.name)} key={currentPath + file.name} {...file} />;
            case "file":
                return <File selected={selectedItems.includes(file.name)} key={currentPath + file.name} {...file} />;
            default:
                console.error("unhandled file", file);
        }
    };

    const handleKeyDownWithCtrlKey = useCallback(
        (e: KeyboardEvent) => {
            if (document.documentElement.dataset.canCopy === "false") {
                return;
            }

            const target = e.target as HTMLElement;

            switch (e.code) {
                case "KeyX": {
                    let targets: PathsParts | PathsParts[];

                    const selectedItems = getSelectedItems();

                    if (selectedItems.length > 1) {
                        targets = selectedItems.map(filename => ({ dirname: currentPath, filename }));
                    } else {
                        const filename = target.dataset.filename;

                        if (!filename) {
                            return;
                        }

                        targets = {
                            dirname: currentPath,
                            filename
                        };
                    }

                    addFileInClipboard({
                        files: targets,
                        action: "cut"
                    });

                    break;
                }
                case "KeyC": {
                    const filename = target.dataset.filename;

                    if (!filename) {
                        return;
                    }

                    addFileInClipboard({
                        files: {
                            dirname: currentPath,
                            filename
                        },
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

                    pasteFile(to);
                }
            }
        },
        [currentPath, getSelectedItems]
    );

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

        let focusedElementIndex = Array.from(listContainerRef.current.children as unknown as HTMLElement[]).findIndex(
            e => e.dataset.filename === (document.activeElement as HTMLElement)?.dataset.filename
        );

        if (focusedElementIndex === -1) {
            const selectedItems = getSelectedItems();

            if (selectedItems.length) {
                for (const item of listContainerRef.current.children) {
                    const filename = (item as HTMLElement)?.dataset.filename;

                    if (filename && selectedItems.includes(filename)) {
                        (item as HTMLElement)?.focus();

                        break;
                    }
                }
            } else {
                (listContainerRef.current.children.item(0) as HTMLElement | null)?.focus();
            }

            return;
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
    }, [getSelectedItems]);

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

    const handleListWrapperClick: React.MouseEventHandler<HTMLDivElement> = e => {
        const target = e.target as HTMLElement;

        if (e.currentTarget.isSameNode(target) && selectedItems.length > 0) {
            return clearSelectedItems();
        }

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const targetFilename = target.dataset.filename!;

        if (e.shiftKey) {
            const activeElement = document.activeElement as HTMLElement;

            if (!activeElement.dataset.filename || firstSelected === targetFilename) {
                return;
            }

            if (!firstSelected) {
                return setFirstSelected(activeElement.dataset.filename);
            }

            const files = Array.from(listContainerRef.current?.children as unknown as HTMLElement[]);
            const firstSelectedIndex = files.findIndex(f => f.dataset.filename === firstSelected);
            const targetIndex = files.findIndex(f => f.dataset.filename === targetFilename);
            let startIndex = Math.min(firstSelectedIndex, targetIndex);
            const endIndex = Math.max(firstSelectedIndex, targetIndex);
            const newSelected: string[] = [];

            for (; startIndex <= endIndex; startIndex++) {
                const filename = files[startIndex].dataset.filename;

                if (filename) {
                    newSelected.push(filename);
                }
            }

            return setSelectedItems(newSelected);
        }

        if (e.ctrlKey) {
            if (targetFilename === firstSelected) {
                setSelectedItems(prev => prev.filter(f => f !== targetFilename));
            } else {
                setSelectedItems(prev => prev.concat(targetFilename));
            }

            return;
        }

        setFirstSelected(targetFilename);
    };

    useEffect(() => {
        clearSelectedItems();

        document.documentElement.dataset.canCopy = (!!currentPath).toString();
    }, [clearSelectedItems, currentPath]);

    useEffect(() => {
        if (prevTargetFile && !loading) {
            listContainerRef.current?.querySelector<HTMLButtonElement>(`[data-filename="${prevTargetFile}"]`)?.focus();
        }
    }, [loading, prevTargetFile]);

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
                    data-context-menu-type={currentPath ? CTXTypes.explorer : undefined}
                    data-readonly={currentPath ? "" : true}
                    onClick={handleListWrapperClick}
                >
                    {loading ? <div className={styles.loader}></div> : files.map(selectFileComponent)}
                </div>
            </OverlayScrollbarsComponent>

            <FileExistModal />
            <EditFileModal />
            <SelectionArea
                rootElement={listContainerRef.current}
                targetSelector={`[data-context-menu-type="${CTXTypes.file}"]`}
            />
        </>
    );
};

export default FileList;
