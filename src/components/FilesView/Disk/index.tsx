import React, { useMemo, useRef } from 'react';
import xbytes from 'xbytes';

import { DiskSVG } from "../../../assets";

import styles from "./Disk.module.scss";
// import { getDiskBackgroundColor } from '../../../utils';

type DiskProps = CFileDisk;

// const FREE_MEMORY_COLOR_CHANGE_THRESHOLD = 0.60;
// const FREE_MEMORY_COLOR_CHANGE_VALUE_MULTIPLIER = 1 - FREE_MEMORY_COLOR_CHANGE_THRESHOLD;

const Disk: React.FC<DiskProps> = ({ name, totalSpace, availableSpace, mountPoint }) => {
    const availableSpacePercentage = useMemo(() => {
        const onePercent = totalSpace / 100;
        return availableSpace / onePercent;
    }, [availableSpace, totalSpace]);

    const xbytesConfig = useRef<xbytes.MainOpts>({
        fixed: 2,
        prefixIndex: xbytes.parseBytes(totalSpace).prefixIndex
    })

    return (
        <button
            className={styles.wrapper}
            style={{
                // '--available-space-width': availableSpacePercentage + "%",
                // "--free-memory-background-color": getDiskBackgroundColor((availableSpacePercentage / 100 - FREE_MEMORY_COLOR_CHANGE_THRESHOLD) * FREE_MEMORY_COLOR_CHANGE_VALUE_MULTIPLIER)
            } as React.CSSProperties}
        >
            <div className={styles.icon}>
                <DiskSVG />
            </div>

            <p className={styles.name}>{mountPoint} {name}</p>

            <p className={styles.info}>{xbytes(availableSpace, xbytesConfig.current)} / {xbytes(totalSpace, xbytesConfig.current)}</p>
        </button>
    )
}
export default Disk;