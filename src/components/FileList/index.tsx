/* eslint-disable max-lines */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { sep } from "@tauri-apps/api/path";

import Disk from "./Disk";
import File from "./File";
import Folder from "./Folder";
import Scrollbars from "../Scrollbars";
import SelectionArea from "../SelectionArea";
import { EditFileModal, FileExistModal } from "../modals";
import { useExplorerHistory, useFilesSelectionStore } from "@zustand";
import { useListenDragAndDrop, useRefState, useResizeObserver, useWatchPathChange } from "@hooks";
import { CTXTypes, addFileInClipboard, findActiveLayerKeys, joinCN, pasteFile } from "@utils";

import styles from "./FileList.module.scss";

const FileList: React.FC = () => {
    const { prevTargetFile, currentPath } = useExplorerHistory();
    const { selectedItems, clearSelectedItems, setSelectedItems } = useFilesSelectionStore();

    const [isDropTarget, setIsDropTarget] = useState(false);

    const currentPathRef = useRefState(currentPath);
    const selectedItemsRef = useRefState(selectedItems);

    const gridWidth = useRef(0);
    const searchPattern = useRef("");
    const listContainerRef = useRef<HTMLDivElement | null>(null);
    const beforeResetFileSearchTimeout = useRef<NodeJS.Timeout | null>(null);

    const { files, loading } = useWatchPathChange();

    const fileDropTarget = "fileList";

    const selectFileComponent = (file: CFile) => {
        const currentPath = currentPathRef.current;

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
            const dirname = currentPathRef.current;
            const selectedItems = selectedItemsRef.current;

            switch (e.code) {
                case "KeyX": {
                    let targets: PathsParts | PathsParts[];

                    if (selectedItems.length > 1) {
                        targets = Array.from(selectedItems).map(filename => ({ dirname, filename }));
                    } else {
                        const filename = target.dataset.filename;

                        if (!filename) {
                            return;
                        }

                        targets = { dirname, filename };
                    }

                    addFileInClipboard({
                        files: targets,
                        action: "cut"
                    });

                    break;
                }
                case "KeyC": {
                    let targets: PathsParts | PathsParts[];

                    if (selectedItems.length > 1) {
                        targets = Array.from(selectedItems).map(filename => ({ dirname, filename }));
                    } else {
                        const filename = target.dataset.filename;

                        if (!filename) {
                            return;
                        }

                        targets = { dirname, filename };
                    }

                    addFileInClipboard({
                        files: targets,
                        action: "copy"
                    });

                    break;
                }
                case "KeyV": {
                    let to = dirname;
                    const possibleFocusedFileName = (document.activeElement as HTMLElement | null)?.dataset
                        .contextMenuAdditionalInfo;
                    const isNotFile =
                        (document.activeElement as HTMLElement | null)?.dataset.contextMenuType !== "file";

                    if (possibleFocusedFileName && isNotFile) {
                        to = to + sep() + possibleFocusedFileName;
                    }

                    pasteFile(to);
                }
            }
        },
        [currentPathRef, selectedItemsRef]
    );

    const handleSearchItem = (e: KeyboardEvent) => {
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
    };

    const handleListArrowNavigation = useCallback(
        (e: KeyboardEvent) => {
            if (!listContainerRef.current) {
                return;
            }

            e.preventDefault();

            let focusedElementIndex = Array.from(
                listContainerRef.current.children as unknown as HTMLElement[]
            ).findIndex(e => e.dataset.filename === (document.activeElement as HTMLElement)?.dataset.filename);
            const selectedItems = selectedItemsRef.current;

            if (focusedElementIndex === -1) {

                if (selectedItems.length) {
                    for (const item of Array.from(listContainerRef.current.children)) {
                        const filename = (item as HTMLElement)?.dataset.filename;

                        if (filename && selectedItems.includes(filename)) {
                            (item as HTMLElement)?.focus();
                            setSelectedItems([filename]);

                            break;
                        }
                    }
                } else {
                    const firstElement = listContainerRef.current.children.item(0) as HTMLElement | null;
                    const filename = firstElement?.dataset.filename;

                    if (filename) {
                        firstElement.focus();
                        setSelectedItems([filename]);
                    }
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

            const newFocused = listContainerRef.current.children.item(focusedElementIndex) as HTMLElement | null;
            const filename = newFocused?.dataset.filename;

            if (filename) {
                newFocused?.focus();
                setSelectedItems([filename]);
            }
        },
        [selectedItemsRef, setSelectedItems]
    );

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
        [handleKeyDownWithCtrlKey, handleListArrowNavigation]
    );

    const handleListWrapperClick: React.MouseEventHandler<HTMLDivElement> = e => {
        const target = e.target as HTMLElement;
        const selectedItems = selectedItemsRef.current;

        if (!e.ctrlKey && e.currentTarget.isSameNode(target) && selectedItems.length > 0) {
            return clearSelectedItems();
        }

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const targetFilename = target.dataset.filename!;

        if (e.shiftKey) {
            const activeElementFilename = (document.activeElement as HTMLElement | null)?.dataset.filename;

            if (!activeElementFilename) {
                return;
            }

            const files = Array.from(listContainerRef.current?.children as unknown as HTMLElement[]);
            const firstSelectedIndex = files.findIndex(f => selectedItems.includes(f.dataset.filename || ""));

            if (firstSelectedIndex === -1) {
                setSelectedItems([activeElementFilename]);
                (document.activeElement as HTMLElement | null)?.focus();

                return;
            }

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
            const targetIndex = selectedItems.findIndex(entry => entry === targetFilename);

            if (targetIndex === -1) {
                selectedItems.push(targetFilename);
            } else {
                selectedItems.splice(targetIndex, 1); // remove
            }

            setSelectedItems(selectedItems);

            return;
        }

        setSelectedItems([targetFilename]);
    };

    const handleDragCancel: DocumentEventHandler<"tauriDragCancel"> = useCallback(() => {
        setIsDropTarget(false);
    }, []);

    const handleDropOver: DocumentEventHandler<"tauriDropOver"> = useCallback(e => {
        setIsDropTarget(e.detail === fileDropTarget);
    }, []);

    const handleDrop: DocumentEventHandler<"tauriDrop"> = useCallback(e => {
        if (e.detail.target === fileDropTarget) {
            console.log("drop", e);
        }
        setIsDropTarget(false);
    }, []);

    useListenDragAndDrop({
        onDragCancel: handleDragCancel,
        onDropOver: handleDropOver,
        onDrop: handleDrop
    });

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
            const bodyStyle = getComputedStyle(document.body);
            const itemWidth = parseInt(bodyStyle.getPropertyValue("--file-list-item-width"));
            const listContainerGap = parseInt(bodyStyle.getPropertyValue("--file-list-gap"));
            const effectiveItemWidth = itemWidth + listContainerGap;

            if (isNaN(itemWidth)) {
                return console.error("Can't get width of item in file list");
            }

            gridWidth.current = Math.floor((e.contentRect.width + listContainerGap) / effectiveItemWidth);

            listContainerRef.current?.style.setProperty("--count-of-columns", gridWidth.current.toString());
        }
    });

    return (
        <>
            <Scrollbars data-file-list-scrollbar>
                <div
                    ref={listContainerRef}
                    className={joinCN(styles.wrapper, isDropTarget && styles.dropTarget)}
                    onClick={handleListWrapperClick}
                    data-context-menu-type={currentPath ? CTXTypes.explorer : undefined}
                    data-readonly={currentPath ? "" : true}
                    data-file-drop-target={fileDropTarget}
                >
                    {loading ? <div className={styles.loader}></div> : files.map(selectFileComponent)}
                </div>
            </Scrollbars>

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
