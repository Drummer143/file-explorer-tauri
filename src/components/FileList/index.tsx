import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import Disk from './Disk';
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
            case 'file':
                return <div key={file.name}>{file.name}</div>
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