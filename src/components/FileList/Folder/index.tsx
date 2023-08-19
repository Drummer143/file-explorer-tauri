import React from "react";
import { sep } from "@tauri-apps/api/path";

import FileListItemButton from "../../customs/FileListItemButton";
import { CTXTypes } from "@utils";
import { FolderSVG } from "@assets";
import { useExplorerHistory } from "@zustand";

import "./Folder.scss";

type FolderProps = ExplorerDirectory & { selected?: boolean };

const Folder: React.FC<FolderProps> = ({ name, readonly, selected }) => {
    const { currentPath, pushRoute } = useExplorerHistory();

    const handleAction = () => {
        pushRoute(currentPath + sep + name);
    };

    const handleFocus: React.FocusEventHandler<HTMLButtonElement> = e =>
        (e.currentTarget as HTMLElement).ariaSelected = "true";

    const handleBlur: React.FocusEventHandler<HTMLButtonElement> = e =>
        (e.currentTarget as HTMLElement).ariaSelected = "false";

    return (
        <FileListItemButton
            onBlur={handleBlur}
            onFocus={handleFocus}
            title={name}
            onAction={handleAction}
            className="folderItemWrapper"
            data-file-type="folder"
            data-readonly={readonly}
            data-context-menu-type={CTXTypes.file}
            data-filename={name}
            data-filename-lowercased={name.toLocaleLowerCase()}
            aria-selected={selected}
        >
            <div className="folderItemIcon">
                <FolderSVG />
            </div>

            <p className="folderItemDescription">{name}</p>
        </FileListItemButton>
    );
};

export default Folder;
