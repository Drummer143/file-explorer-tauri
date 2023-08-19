import React from "react";
import xbytes from "xbytes";
import { sep } from "@tauri-apps/api/path";
import { convertFileSrc } from "@tauri-apps/api/tauri";

import FileListItemButton from "../../customs/FileListItemButton";
import { FileSVG } from "@assets";
import { CTXTypes } from "@utils";
import { openFile } from "@tauriAPI";
import { useExplorerHistory } from "@zustand";

import "./File.scss";

type FileProps = ExplorerFile & { selected?: boolean };

const File: React.FC<FileProps> = ({ name, size, readonly, subtype, selected }) => {
    const { currentPath } = useExplorerHistory();

    const handleAction = () => openFile(currentPath + sep + name).catch(error => console.error(error));

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
            className="fileItemWrapper"
            data-file-type="file"
            data-readonly={readonly}
            data-file-subtype={subtype}
            data-context-menu-type={CTXTypes.file}
            data-filename={name}
            data-filename-lowercased={name.toLocaleLowerCase()}
            aria-selected={selected}
        >
            <div className="fileItemIcon">
                {subtype === "image" ? <img src={convertFileSrc(currentPath + sep + name)} /> : <FileSVG />}
            </div>

            <div className="fileItemDescription">
                <p className="fileItemName">{name}</p>
                <p className="fileItemSize">{xbytes(size, { fixed: size ? 2 : 0 })}</p>
            </div>
        </FileListItemButton>
    );
};

export default File;
