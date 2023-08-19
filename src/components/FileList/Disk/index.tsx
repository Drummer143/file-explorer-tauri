import React, { useRef } from "react";
import xbytes from "xbytes";

import FileListItemButton from "../../customs/FileListItemButton";
import { DiskSVG } from "@assets";
import { CTXTypes } from "@utils";
import { useExplorerHistory } from "@zustand";

import "./Disk.scss";

type DiskProps = ExplorerDisk & { selected?: boolean };

// const FREE_MEMORY_COLOR_CHANGE_THRESHOLD = 0.60;
// const FREE_MEMORY_COLOR_CHANGE_VALUE_MULTIPLIER = 1 - FREE_MEMORY_COLOR_CHANGE_THRESHOLD;

const Disk: React.FC<DiskProps> = ({ name, totalSpace, availableSpace, mountPoint, selected }) => {
    const { pushRoute } = useExplorerHistory();

    // const availableSpacePercentage = useMemo(() => {
    //     const onePercent = totalSpace / 100;
    //     return availableSpace / onePercent;
    // }, [availableSpace, totalSpace]);

    const xbytesConfig = useRef<xbytes.MainOpts>({
        fixed: 2,
        prefixIndex: xbytes.parseBytes(totalSpace).prefixIndex
    });

    const handleAction = () => pushRoute(mountPoint);

    const handleFocus: React.FocusEventHandler<HTMLButtonElement> = e =>
        (e.currentTarget as HTMLElement).ariaSelected = "true";

    const handleBlur: React.FocusEventHandler<HTMLButtonElement> = e =>
        (e.currentTarget as HTMLElement).ariaSelected = "false";

    return (
        <FileListItemButton
            onBlur={handleBlur}
            onFocus={handleFocus}
            title={mountPoint + name}
            onAction={handleAction}
            className="diskItemWrapper"
            data-readonly="true"
            data-file-type="disk"
            data-context-menu-type={CTXTypes.file}
            data-filename={mountPoint}
            data-filename-lowercased={name.toLocaleLowerCase()}
            aria-selected={selected}
        // style={{
        //     '--available-space-width': availableSpacePercentage + "%",
        //     "--free-memory-background-color":
        //             getDiskBackgroundColor((availableSpacePercentage / 100 - FREE_MEMORY_COLOR_CHANGE_THRESHOLD)
        //             * FREE_MEMORY_COLOR_CHANGE_VALUE_MULTIPLIER)
        // } as React.CSSProperties}
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
        </FileListItemButton>
    );
};

export default Disk;
