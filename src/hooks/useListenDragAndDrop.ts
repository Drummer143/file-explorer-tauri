import { useEffect } from "react";

interface UseListenDragAndDropProps {
    onDrop?: DocumentEventHandler<"tauriDrop">;
    onDrag?: DocumentEventHandler<"tauriDrag">;
    onDropOver?: DocumentEventHandler<"tauriDropOver">;
    onDragCancel?: DocumentEventHandler<"tauriDragCancel">;
}

export const useListenDragAndDrop = ({ onDragCancel, onDrop, onDropOver, onDrag }: UseListenDragAndDropProps) => {
    useEffect(() => {
        if (!onDragCancel) {
            return;
        }

        const handleDragCancel: DocumentEventHandler<"tauriDragCancel"> = e => {
            e.stopPropagation();
            onDragCancel(e);
        };

        document.addEventListener("tauriDragCancel", handleDragCancel);

        return () => {
            document.removeEventListener("tauriDragCancel", handleDragCancel);
        };
    }, [onDragCancel]);

    useEffect(() => {
        if (!onDrag) {
            return;
        }

        const handleDrag: DocumentEventHandler<"tauriDrag"> = e => {
            e.stopPropagation();
            onDrag(e);
        };

        document.addEventListener("tauriDrag", handleDrag);

        return () => {
            document.removeEventListener("tauriDrag", handleDrag);
        };
    }, [onDrag]);

    useEffect(() => {
        if (!onDrop) {
            return;
        }

        const handleDrop: DocumentEventHandler<"tauriDrop"> = e => {
            e.stopPropagation();
            onDrop(e);
        };

        document.addEventListener("tauriDrop", handleDrop);

        return () => {
            document.removeEventListener("tauriDrop", handleDrop);
        };
    }, [onDrop]);

    useEffect(() => {
        if (!onDropOver) {
            return;
        }

        const handleDropOver: DocumentEventHandler<"tauriDropOver"> = e => {
            e.stopPropagation();
            onDropOver(e);
        };

        document.addEventListener("tauriDropOver", handleDropOver);

        return () => {
            document.removeEventListener("tauriDropOver", handleDropOver);
        };
    }, [onDropOver]);
};
