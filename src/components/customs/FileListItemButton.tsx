import React from 'react';

type FileListItemActionHandler = React.MouseEventHandler<HTMLButtonElement>

type FileListItemButtonProps = Omit<React.ComponentPropsWithoutRef<"button">, "onDoubleClick" | "onKeyDown"> & {
    onAction?: FileListItemActionHandler
};

const FileListItemButton: React.FC<FileListItemButtonProps> = ({ onAction, ...props }) => {
    // Some buttons (for example, enter or space) also trigger "click" event with click position at (0:0) coordinates.
    const handleClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
        if (!e.clientX && !e.clientY && onAction) {
            onAction(e);
        }
    }

    return (
        <button
            {...props}
            onDoubleClick={onAction}
            onClick={handleClick}
        />
    )
}
export default FileListItemButton;