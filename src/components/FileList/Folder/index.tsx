import React from "react";
import { sep } from "@tauri-apps/api/path";

import { CTXTypes } from "@utils";
import { FolderSVG } from "@assets";
import { useExplorerHistory } from "@zustand";

import "./Folder.scss";

type FolderProps = ExplorerDirectory & { selected?: boolean };

const Folder: React.FC<FolderProps> = ({ name, readonly, selected }) => {
    const { currentPath, pushRoute } = useExplorerHistory();

    const handleAction = () => {
        pushRoute(currentPath + sep() + name);
    };

    const handleKeyDown: React.KeyboardEventHandler<HTMLButtonElement> = e => {
        if (["Space", "Enter"].includes(e.code)) {
            handleAction();
        }
    };

    return (
        <button
            onDoubleClick={handleAction}
            onKeyDown={handleKeyDown}
            title={name}
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
        </button>
    );
};

export default Folder;
