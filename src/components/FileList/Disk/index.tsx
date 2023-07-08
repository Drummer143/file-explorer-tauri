import React, { useRef } from "react";
import xbytes from "xbytes";

import FileListItemButton from "../../customs/FileListItemButton";
import { DiskSVG } from "@assets";
import { CTXTypes } from "@utils";
import { useExplorerHistory } from "@zustand";

import styles from "./Disk.module.scss";

type DiskProps = ExplorerDisk;

// const FREE_MEMORY_COLOR_CHANGE_THRESHOLD = 0.60;
// const FREE_MEMORY_COLOR_CHANGE_VALUE_MULTIPLIER = 1 - FREE_MEMORY_COLOR_CHANGE_THRESHOLD;

const Disk: React.FC<DiskProps> = ({ name, totalSpace, availableSpace, mountPoint }) => {
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

    return (
        <FileListItemButton
            onAction={handleAction}
            className={styles.wrapper}
            data-context-menu-type={CTXTypes.disk}
            data-context-menu-additional-info={mountPoint}
            data-context-menu-additional-info-lowercased={name.toLocaleLowerCase()}
        // style={{
        //     '--available-space-width': availableSpacePercentage + "%",
        //     "--free-memory-background-color":
        //             getDiskBackgroundColor((availableSpacePercentage / 100 - FREE_MEMORY_COLOR_CHANGE_THRESHOLD)
        //             * FREE_MEMORY_COLOR_CHANGE_VALUE_MULTIPLIER)
        // } as React.CSSProperties}
        >
            <div className={styles.icon}>
                <DiskSVG />
            </div>

            <div className={styles.description}>
                <p className={styles.name}>
                    {mountPoint} {name}
                </p>

                <p className={styles.info}>
                    {xbytes(availableSpace, xbytesConfig.current)} / {xbytes(totalSpace, xbytesConfig.current)}
                </p>
            </div>
        </FileListItemButton>
    );
};

export default Disk;
