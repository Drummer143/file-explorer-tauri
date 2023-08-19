import React, { useCallback, useEffect, useRef, useState } from "react";

import { useFilesSelectionStore } from "@zustand";

import styles from "./SelectionArea.module.scss";

type SelectionAreaProps = {
    rootElementRef: React.RefObject<HTMLElement>;
    targetSelector: string;
    getItemId: (item: Element) => string
}

const SelectionArea: React.FC<SelectionAreaProps> = ({ rootElementRef, targetSelector, getItemId }) => {
    const { setSelectedItems } = useFilesSelectionStore(state => state);

    const [hidden, setHidden] = useState(false);

    const startPos = useRef({ x: 0, y: 0 });
    const currentPos = useRef({ x: 0, y: 0 });
    const isMoving = useRef(false);

    const handleMoveArea = useCallback((e: MouseEvent) => {
        currentPos.current = { x: e.clientX, y: e.clientY };

        if (!isMoving.current) {
            rootElementRef.current?.style.setProperty("pointer-events", "none");
            setHidden(false);

            isMoving.current = true;
        }

        const targets = rootElementRef.current?.querySelectorAll(targetSelector);

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

            if (isSelected) {
                selectedIds.push(getItemId(target));
            }
        });

        setSelectedItems(selectedIds);
    }, [getItemId, rootElementRef, setSelectedItems, targetSelector]);

    const handleEndSelecting = useCallback(() => {
        document.removeEventListener("mousemove", handleMoveArea);

        isMoving.current = false;

        rootElementRef.current?.style.removeProperty("pointer-events");

        setHidden(true);
    }, [handleMoveArea, rootElementRef]);

    const handleStartSelecting = useCallback((e: MouseEvent) => {
        if (!e.target || !e.currentTarget || !(e.currentTarget as HTMLElement).isSameNode(e.target as HTMLElement)) {
            return;
        }

        document.addEventListener("mousemove", handleMoveArea);
        document.addEventListener("mouseup", handleEndSelecting, { once: true });

        startPos.current = { y: e.clientY, x: e.clientX };
        currentPos.current = { y: e.clientY, x: e.clientX };
    }, [handleEndSelecting, handleMoveArea]);

    useEffect(() => {
        const root = rootElementRef.current;

        if (!root) {
            return;
        }

        root.addEventListener("mousedown", handleStartSelecting);

        return () => {
            root.removeEventListener("mousedown", handleStartSelecting);
        };
    }, [handleStartSelecting, rootElementRef]);

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