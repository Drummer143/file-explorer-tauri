import React, { forwardRef } from "react";

type FileListItemActionHandler = (e: React.KeyboardEvent<HTMLButtonElement> | React.MouseEvent<HTMLButtonElement>) => void;

type FileListItemButtonProps = Omit<React.ComponentPropsWithoutRef<"button">, "onDoubleClick" | "onKeyDown"> & {
    onAction?: FileListItemActionHandler;
};

const FileListItemButton= forwardRef<HTMLButtonElement, FileListItemButtonProps>(({ onAction, ...otherProps }, ref) => {
    // Some buttons (for example, enter or space) also trigger "click" event with click position at (0:0) coordinates.
    const handleClick: React.KeyboardEventHandler<HTMLButtonElement> = e => {
        if (onAction && (e.code === "Space" || e.code === "Enter")) {
            onAction(e);
        }
    };

    return <button {...otherProps} onDoubleClick={onAction} ref={ref} onKeyDown={handleClick} />;
});

FileListItemButton.displayName = "FileListItemButton";

export default FileListItemButton;
