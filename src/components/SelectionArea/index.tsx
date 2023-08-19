import React, { useCallback, useEffect, useRef, useState } from "react";

import styles from "./SelectionArea.module.scss";

type SelectionAreaProps = {
    rootElementRef: React.RefObject<HTMLElement>;
    targetSelector: string;
    getItemId: (item: Element) => string
    setSelectedIds: (ids: string[]) => void
}

const SelectionArea: React.FC<SelectionAreaProps> = ({ rootElementRef, targetSelector, getItemId, setSelectedIds }) => {
    const [hidden, setHidden] = useState(false);

    const startPos = useRef({ x: 0, y: 0 });
    const currentPos = useRef({ x: 0, y: 0 });

    const handleMoveArea = useCallback((e: MouseEvent) => {
        currentPos.current = { x: e.clientX, y: e.clientY };

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

        setSelectedIds(selectedIds);
    }, [getItemId, rootElementRef, setSelectedIds, startPos, targetSelector]);

    const handleEndSelecting = useCallback(() => {
        document.removeEventListener("mousemove", handleMoveArea);

        rootElementRef.current?.style.removeProperty("pointer-events");

        const resetSelectedItems = (e: MouseEvent) => {
            if((e.target as HTMLElement).dataset.tauriDragRegion !== "true") {
                document.removeEventListener("mousedown", resetSelectedItems);

                setSelectedIds([]);
            }
        }

        document.addEventListener("mousedown", resetSelectedItems);

        setHidden(true);
    }, [handleMoveArea, rootElementRef, setSelectedIds]);

    const handleStartSelecting = useCallback((e: MouseEvent) => {
        if (!e.target || !e.currentTarget || !(e.currentTarget as HTMLElement).isSameNode(e.target as HTMLElement)) {
            return;
        }

        rootElementRef.current?.style.setProperty("pointer-events", "none");

        document.addEventListener("mousemove", handleMoveArea);
        document.addEventListener("mouseup", handleEndSelecting, { once: true });

        startPos.current = { y: e.clientY, x: e.clientX };
        currentPos.current = { y: e.clientY, x: e.clientX };
        setHidden(false);
    }, [handleEndSelecting, handleMoveArea, rootElementRef]);

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