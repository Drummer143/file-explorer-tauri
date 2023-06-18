import React, { useState } from 'react';

import Disk from './Disk';
import File from './File';
import Folder from './Folder';
import { useWatchPathChange } from '../../hooks';

import styles from "./FileList.module.scss";

const FileList: React.FC = () => {
    const [files, setFiles] = useState<CFile[]>([]);

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

    useWatchPathChange(setFiles);

    return (
        <div className={styles.wrapper}>
            {files.map(mapFiles)}
        </div>
    )
}
export default FileList;