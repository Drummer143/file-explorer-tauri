import React, { ChangeEventHandler, FormEventHandler, useEffect, useState } from "react";
import { message } from "@tauri-apps/api/dialog";
import { normalize } from "@tauri-apps/api/path";

import InteractivePath from "./InteractivePath";
import { pathExists } from "@tauriAPI";
import { useExplorerHistory } from "@zustand";

import styles from "./PathInput.module.scss";

const PathInput: React.FC = () => {
    const { currentPath, pushRoute } = useExplorerHistory();

    const [inputValue, setInputValue] = useState(currentPath);

    const handleSubmit: FormEventHandler<HTMLFormElement & { path: HTMLInputElement }> = async e => {
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
    };

    const handleChange: ChangeEventHandler<HTMLInputElement> = e => {
        setInputValue(e.target.value);
    };

    useEffect(() => setInputValue(currentPath), [currentPath]);

    return (
        <form className={styles.wrapper} onSubmit={handleSubmit}>
            <div className={styles.inputContainer} data-current-path={currentPath}>
                <input
                    type="text"
                    name="path"
                    autoComplete="off"
                    className={styles.input}
                    value={inputValue}
                    onChange={handleChange}
                />

                {currentPath && <InteractivePath />}
            </div>
        </form>
    );
};

export default PathInput;
