import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useRefState } from "@hooks";
import { useFilesSelectionStore } from "@zustand";

import styles from "./SelectionArea.module.scss";
import { appWindow } from "@tauri-apps/api/window";

type SelectionAreaProps = {
    targetSelector: string;

    rootElement?: HTMLElement | null;
}

const SelectionArea: React.FC<SelectionAreaProps> = ({ rootElement, targetSelector }) => {
    const { setSelectedItems, selectedItems } = useFilesSelectionStore(state => state);

    const [hidden, setHidden] = useState(false);

    const rootRect = useMemo((): { top: number; bottom: number; left: number; right: number } => {
        if (!rootElement) {
            return { bottom: 0, top: 0, left: 0, right: 0 };
        }

        const rect = rootElement.getBoundingClientRect();

        return rect;
    }, [rootElement]);

    console.count("rerender");

    const startPos = useRef({ x: 0, y: 0 });
    const currentPos = useRef({ x: 0, y: 0 });
    const isMoving = useRef(false);
    const prevSelectedItems = useRef(selectedItems);
    const isCtrlKeyPressed = useRef(false);

    const selectedItemsRef = useRefState(selectedItems);

    const handleMoveArea = useCallback((e: MouseEvent) => {
        if (!isMoving.current) {
            rootElement?.style.setProperty("pointer-events", "none");
            setHidden(false);

            prevSelectedItems.current = selectedItemsRef.current;
            isMoving.current = true;
            isCtrlKeyPressed.current = e.ctrlKey;
        }

        currentPos.current = {
            y: Math.max(Math.min(e.clientY, rootRect.bottom), rootRect.top),
            x: Math.max(Math.min(e.clientX, rootRect.right), rootRect.left)
        };

        const targets = rootElement?.querySelectorAll(targetSelector);

        if (!targets?.length) {
            return;
        }

        const selectedIds = isCtrlKeyPressed.current ? new Set(prevSelectedItems.current) : new Set<string>();

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

            const isSelected = !(rect.right < minX ||
                rect.left > maxX ||
                rect.bottom < minY ||
                rect.top > maxY);

            if (isSelected) {
                if (selectedIds.has(filename)) {
                    prevSelectedItems.current.delete(filename);
                }

                selectedIds.add(filename);
            }
        });

        setSelectedItems(selectedIds);
    }, [rootElement, selectedItemsRef, setSelectedItems, targetSelector]);

    const handleEndSelecting = useCallback(() => {
        document.removeEventListener("mousemove", handleMoveArea);

        appWindow.setResizable(true);

        isMoving.current = false;
        isCtrlKeyPressed.current = false;
        prevSelectedItems.current = new Set();

        rootElement?.style.removeProperty("pointer-events");

        setHidden(true);
    }, [handleMoveArea, rootElement]);

    const handleStartSelecting = useCallback((e: MouseEvent) => {
        if (!e.target || !e.currentTarget || !(e.currentTarget as HTMLElement).isSameNode(e.target as HTMLElement)) {
            return;
        }

        appWindow.setResizable(false);

        document.addEventListener("mousemove", handleMoveArea);
        document.addEventListener("mouseup", handleEndSelecting, { once: true });

        startPos.current = { y: e.clientY, x: e.clientX };
        currentPos.current = startPos.current;
    }, [handleEndSelecting, handleMoveArea]);

    useEffect(() => {
        if (!rootElement) {
            return;
        }

        rootElement.addEventListener("mousedown", handleStartSelecting);

        return () => {
            rootElement.removeEventListener("mousedown", handleStartSelecting);
        };
    }, [handleStartSelecting, rootElement]);

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
