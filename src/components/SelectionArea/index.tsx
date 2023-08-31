import React, { useCallback, useEffect, useRef, useState } from "react";

import { useFilesSelectionStore } from "@zustand";

import styles from "./SelectionArea.module.scss";

type SelectionAreaProps = {
    targetSelector: string;

    rootElement?: HTMLElement | null;
}

const SelectionArea: React.FC<SelectionAreaProps> = ({ rootElement, targetSelector }) => {
    const { setSelectedItems } = useFilesSelectionStore(state => state);

    const [hidden, setHidden] = useState(false);

    const startPos = useRef({ x: 0, y: 0 });
    const currentPos = useRef({ x: 0, y: 0 });
    const isMoving = useRef(false);

    const handleMoveArea = useCallback((e: MouseEvent) => {
        if (!isMoving.current) {
            rootElement?.style.setProperty("pointer-events", "none");
            setHidden(false);

            isMoving.current = true;
        }

        currentPos.current = { y: e.clientY, x: e.clientX };

        const targets = rootElement?.querySelectorAll(targetSelector);

        if (!targets?.length) {
            return;
        }

        const selectedIds: string[] = [];

        const maxX = Math.max(startPos.current.x, currentPos.current.x);
        const minX = Math.min(startPos.current.x, currentPos.current.x);
        const minY = Math.min(startPos.current.y, currentPos.current.y);
        const maxY = Math.max(startPos.current.y, currentPos.current.y);

        Array.from(targets).forEach(target => {
            const rect = target.getBoundingClientRect();

            const isSelected = !(rect.right < minX ||
                rect.left > maxX ||
                rect.bottom < minY ||
                rect.top > maxY);

            const filename = (target as HTMLElement)?.dataset.filename;

            if (isSelected && filename) {
                selectedIds.push(filename);
            }
        });

        setSelectedItems(selectedIds);
    }, [rootElement, setSelectedItems, targetSelector]);

    useEffect(() => {
        console.log("rerender");
    }, [setSelectedItems]);

    const handleEndSelecting = useCallback(() => {
        document.removeEventListener("mousemove", handleMoveArea);

        isMoving.current = false;

        rootElement?.style.removeProperty("pointer-events");

        setHidden(true);
    }, [handleMoveArea, rootElement]);

    const handleStartSelecting = useCallback((e: MouseEvent) => {
        if (!e.target || !e.currentTarget || !(e.currentTarget as HTMLElement).isSameNode(e.target as HTMLElement)) {
            return;
        }

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

export default SelectionArea;