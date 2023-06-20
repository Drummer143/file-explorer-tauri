import React, { ChangeEventHandler, FormEventHandler, useEffect, useState } from 'react';
import { message } from "@tauri-apps/api/dialog";
import { normalize, sep } from "@tauri-apps/api/path";

import { pathExists } from '../../../tauriAPIWrapper';
import { useExplorerHistory } from '../../../zustand';

import styles from "./PathInput.module.scss";

const PathInput: React.FC = () => {
    const { currentPath, pushRoute } = useExplorerHistory();

    const [inputValue, setInputValue] = useState(currentPath);

    const handleSubmit: FormEventHandler<HTMLFormElement & { path: HTMLInputElement }> = async (e) => {
        e.preventDefault();

        const form = e.currentTarget;
        const isExists = await pathExists(inputValue);
        const normalizedPath = await normalize(inputValue);

        if (normalizedPath === currentPath) {
            return;
        }

        if (!isExists) {
            message("This path doesn't exist", { type: "error" });

            form.path.focus();

            return;
        }

        pushRoute(normalizedPath);
        setInputValue(normalizedPath);
    }

    const handleChange: ChangeEventHandler<HTMLInputElement> = e => {
        setInputValue(e.target.value);
    }

    const handlePathPartClick = (partIndex: number) => {
        const currentPathParts = currentPath.split(sep);

        // partIndex equals to (part index in array + 1), so if part is last in past
        // than it is current folder and there is no need to move in this folder
        if (partIndex === currentPathParts.length) {
            return;
        }

        const newPath = currentPathParts.slice(0, partIndex + 1).join(sep);

        pushRoute(newPath);
    }

    useEffect(() => setInputValue(currentPath), [currentPath]);

    return (
        <form className={styles.wrapper} onSubmit={handleSubmit}>
            <div className={styles.inputContainer} data-current-path={currentPath}>
                <input type="text" name='path' className={styles.input} value={inputValue} onChange={handleChange} />

                <div className={styles.currentPath}>
                    {currentPath.split(sep).map((pathPart, i, { length }) => (
                        <React.Fragment key={pathPart + i}>
                            <button type='button' className={styles.pathPart} onClick={() => handlePathPartClick(i)}>
                                {pathPart}
                            </button>

                            {length - 1 !== i && <p className={styles.pathSeparator}>{sep}</p>}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </form>
    );
}
export default PathInput;
