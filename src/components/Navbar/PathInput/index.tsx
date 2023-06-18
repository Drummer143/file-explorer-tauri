import React, { ChangeEventHandler, FocusEventHandler, FormEventHandler, useEffect, useState } from 'react';
import { message } from "@tauri-apps/api/dialog";
import { normalize } from "@tauri-apps/api/path";

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

    useEffect(() => setInputValue(currentPath), [currentPath]);

    return (
        <form className={styles.wrapper} onSubmit={handleSubmit}>
            <div className={styles.inputContainer} data-current-path={currentPath}>
                <input type="text" name='path' className={styles.input} value={inputValue} onChange={handleChange} />
                <p className={styles.currentPath}>{currentPath}</p>
            </div>
        </form>
    );
}
export default PathInput;
