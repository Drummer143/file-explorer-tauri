import React, { useRef, useState } from 'react';

import Disk from './Disk';
import File from './File';
import Folder from './Folder';
import { CTXTypes } from '../../utils';
import { useResizeObserver, useWatchPathChange } from '../../hooks';

import styles from "./FileList.module.scss";

const FileList: React.FC = () => {
    const listContainerRef = useRef<HTMLDivElement>(null);

    const mapFiles = (file: CFile) => {
        switch (file.type) {
            case 'disk':
                return <Disk key={file.mountPoint} {...file} />
            case 'directory':
                return <Folder key={file.name} {...file} />
            case 'file':
                return <File key={file.name} {...file} />
        }
    }

    const { files } = useWatchPathChange();

    useResizeObserver({
        target: listContainerRef.current,
        onResize: ([e]) => {
            const itemWidth = parseInt(getComputedStyle(document.body).getPropertyValue("--file-list-item-width"));

            if (isNaN(itemWidth)) {
                return console.error("Can't get width of item in file list");
            }

            const countOfColumns = Math.floor(e.contentRect.width / itemWidth);

            listContainerRef.current?.style.setProperty("--count-of-columns", countOfColumns.toString());
        }
    });

    return (
        <div ref={listContainerRef} className={styles.wrapper} data-context-menu-type={CTXTypes.explorer}>
            {files.map(mapFiles)}
        </div>
    )
}
export default FileList;