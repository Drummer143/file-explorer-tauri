import React from "react";
import xbytes from "xbytes";
import { sep } from "@tauri-apps/api/path";

import { FileSVG } from "@assets";
import { CTXTypes } from "@utils";
import { openFile } from "@tauriAPI";
import { useExplorerHistory } from "@zustand";

import "./File.scss";

type FileProps = ExplorerFile & { selected?: boolean };

const File: React.FC<FileProps> = ({ name, size, readonly, selected, type }) => {
    const { currentPath } = useExplorerHistory();

    const handleAction = () => openFile(currentPath + sep() + name).catch(error => console.error(error));

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
            className="fileItemWrapper"
            data-file-type="file"
            data-readonly={readonly}
            data-file-subtype={type}
            data-context-menu-type={CTXTypes.file}
            data-filename={name}
            data-filename-lowercased={name.toLocaleLowerCase()}
            aria-selected={selected}
        >
            <div className="fileItemIcon">
                {/* type === "image" ? <img src={convertFileSrc(currentPath + sep() + name)} /> :  */ <FileSVG />}
            </div>

            <div className="fileItemDescription">
                <p className="fileItemName">{name}</p>
                <p className="fileItemSize">{xbytes(size, { fixed: size ? 2 : 0 })}</p>
            </div>
        </button>
    );
};

export default File;
