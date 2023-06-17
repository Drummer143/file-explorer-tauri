import React, { useEffect, useState } from 'react';

import Disk from './Disk';
import { getDisks } from "../../tauriAPIWrapper/invoke";

import styles from "./FileView.module.scss";

const FilesView: React.FC = () => {
    const [files, setFiles] = useState<CFile[]>([]);

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
        getDisks().then(res => setFiles(res));
    }, []);

    return (
        <div className={styles.wrapper}>
            {files.map(mapFiles)}
        </div>
    )
}
export default FilesView;