import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import Disk from './Disk';
import File from './File';
import Folder from './Folder';
import { getDisks, readDir } from "../../tauriAPIWrapper/invoke";

import styles from "./FileList.module.scss";

const FileList: React.FC = () => {
    const [files, setFiles] = useState<CFile[]>([]);

    const { path } = useParams<{ path: string }>();

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

    useEffect(() => {
        if (path) {
            readDir(path + "\\").then(setFiles);
        } else {
            getDisks().then(setFiles);
        }
    }, [path]);

    return (
        <div className={styles.wrapper}>
            {files.map(mapFiles)}
        </div>
    )
}
export default FileList;