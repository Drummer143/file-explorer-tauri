import React, { memo, useCallback, useEffect, useRef, useState } from "react";

import { getCurrent } from "@tauri-apps/api/window";
import { useFilesSelectionStore } from "@zustand";
import { useRefState, useResizeObserver } from "@hooks";

import styles from "./SelectionArea.module.scss";

interface RootRect {
    top: number;
    bottom: number;
    left: number;
    right: number;
}

type SelectionAreaProps = {
    targetSelector: string;

    rootElement?: HTMLElement | null;
};

const SelectionArea: React.FC<SelectionAreaProps> = ({ rootElement, targetSelector }) => {
    const { setSelectedItems, selectedItems } = useFilesSelectionStore();

    const [hidden, setHidden] = useState(false);

    const rootRect = useRef<RootRect>({ bottom: 0, top: 0, left: 0, right: 0 });
    const startPos = useRef({ x: 0, y: 0 });
    const currentPos = useRef({ x: 0, y: 0 });
    const isMoving = useRef(false);
    const prevSelectedItems = useRef(selectedItems);
    const isCtrlKeyPressed = useRef(false);

    const selectedItemsRef = useRefState(selectedItems);

    useResizeObserver({
        target: rootElement,
        onResize: ([e]) => {
            const { bottom, top, left, right } = e.target.getBoundingClientRect();

            rootRect.current = { bottom, top, left, right };
        }
    });

    const handleMoveArea = useCallback(
        (e: MouseEvent) => {
            if (!isMoving.current) {
                rootElement?.style.setProperty("pointer-events", "none");
                setHidden(false);

                prevSelectedItems.current = selectedItemsRef.current;
                isMoving.current = true;
                isCtrlKeyPressed.current = e.ctrlKey;
            }

            currentPos.current = {
                y: Math.max(Math.min(e.clientY, rootRect.current.bottom), rootRect.current.top),
                x: Math.max(Math.min(e.clientX, rootRect.current.right), rootRect.current.left)
            };

            const targets = rootElement?.querySelectorAll(targetSelector);

            if (!targets?.length) {
                return;
            }

            const selectedIds = isCtrlKeyPressed.current ? prevSelectedItems.current.concat() : [];

            const maxX = Math.max(startPos.current.x, currentPos.current.x);
            const minX = Math.min(startPos.current.x, currentPos.current.x);
            const minY = Math.min(startPos.current.y, currentPos.current.y);
            const maxY = Math.max(startPos.current.y, currentPos.current.y);

            Array.from(targets).forEach(target => {
                const rect = target.getBoundingClientRect();

                const filename = (target as HTMLElement)?.dataset.filename;

                if (!filename) {
                    return;
                }

                const isSelected = !(rect.right < minX || rect.left > maxX || rect.bottom < minY || rect.top > maxY);

                if (isSelected) {
                    const targetIndex = selectedItemsRef.current.findIndex(entry => entry === filename);

                    if (targetIndex !== -1) {
                        prevSelectedItems.current.splice(targetIndex, 1);
                    }

                    selectedIds.push(filename);
                }
            });

            setSelectedItems(selectedIds);
            // eslint-disable-next-line react-hooks/exhaustive-deps
        },
        [rootElement, setSelectedItems, targetSelector]
    );

    const handleEndSelecting = useCallback(() => {
        document.removeEventListener("mousemove", handleMoveArea);

        getCurrent().setResizable(true);

        isMoving.current = false;
        isCtrlKeyPressed.current = false;
        prevSelectedItems.current = [];

        rootElement?.style.removeProperty("pointer-events");

        setHidden(true);
    }, [handleMoveArea, rootElement]);

    const handleStartSelecting = useCallback(
        (e: MouseEvent) => {
            if (
                !e.target ||
                !e.currentTarget ||
                !(e.currentTarget as HTMLElement).isSameNode(e.target as HTMLElement)
            ) {
                return;
            }

            getCurrent().setResizable(false);

            document.addEventListener("mousemove", handleMoveArea);
            document.addEventListener("mouseup", handleEndSelecting, { once: true });

            startPos.current = { y: e.clientY, x: e.clientX };
            currentPos.current = startPos.current;
        },
        [handleEndSelecting, handleMoveArea]
    );

    useEffect(() => {
        if (!rootElement) {
            return;
        }

        rootElement.addEventListener("mousedown", handleStartSelecting);

        return () => {
            rootElement.removeEventListener("mousedown", handleStartSelecting);
        };
    }, [handleStartSelecting, rootElement]);

    useEffect(() => {
        const unlisten = getCurrent().onFocusChanged(e => {
            if (!e.payload) {
                handleEndSelecting();
                document.removeEventListener("mouseup", handleEndSelecting);
            }
        });

        return () => {
            unlisten.then(unlisten => unlisten());
        };
    }, [handleEndSelecting]);

    return (
        <div
            className={styles.wrapper}
            style={{
                top: Math.min(startPos.current.y, currentPos.current.y) + "px",
                left: Math.min(startPos.current.x, currentPos.current.x) + "px",
                height: Math.abs(startPos.current.y - currentPos.current.y) + "px",
                width: Math.abs(startPos.current.x - currentPos.current.x) + "px",
                display: hidden ? "none" : undefined
            }}
        ></div>
    );
};

export default memo(SelectionArea);
