import React, { useRef } from "react";
import xbytes from "xbytes";

import { DiskSVG } from "@assets";
import { CTXTypes } from "@utils";
import { useExplorerHistory } from "@zustand";

import "./Disk.scss";

type DiskProps = ExplorerDisk & { selected?: boolean };

const Disk: React.FC<DiskProps> = ({ name, totalSpace, availableSpace, mountPoint, selected }) => {
    const { pushRoute } = useExplorerHistory();

    const xbytesConfig = useRef<xbytes.MainOpts>({
        fixed: 2,
        prefixIndex: xbytes.parseBytes(totalSpace).prefixIndex
    });

    const handleAction = () => pushRoute(mountPoint);

    const handleKeyDown: React.KeyboardEventHandler<HTMLButtonElement> = e => {
        if (["Space", "Enter"].includes(e.code)) {
            handleAction();
        }
    };

    return (
        <button
            onDoubleClick={handleAction}
            onKeyDown={handleKeyDown}
            title={mountPoint + name}
            className="diskItemWrapper"
            data-readonly="true"
            data-file-type="disk"
            data-context-menu-type={CTXTypes.file}
            data-filename={mountPoint}
            data-filename-lowercased={name.toLocaleLowerCase()}
            aria-selected={selected}
        >
            <div className="diskItemIcon">
                <DiskSVG />
            </div>

            <div className="diskItemDescription">
                <p className="diskItemName">
                    {mountPoint} {name}
                </p>

                <p className="diskItemInfo">
                    {xbytes(availableSpace, xbytesConfig.current)} / {xbytes(totalSpace, xbytesConfig.current)}
                </p>
            </div>
        </button>
    );
};

export default Disk;
