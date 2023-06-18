import React from 'react';
import xbytes from 'xbytes';

import { FileSVG } from '../../../assets';

import FileListItemButton from '../../customs/FileListItemButton';

import styles from "./File.module.scss";

type FileProps = ExplorerFile;

const File: React.FC<FileProps> = ({ name, size }) => {
    return (
        <FileListItemButton onAction={e => console.log(e)} className={styles.wrapper}>
            <div className={styles.icon}>
                <FileSVG />
            </div>

            <div className={styles.description}>
                <p className={styles.name}>{name}</p>
                <p className={styles.size}>{xbytes(size, { fixed: size ? 2 : 0 })}</p>
            </div>
        </FileListItemButton>
    )
}

export default File;
