import React, { ChangeEventHandler, FormEventHandler, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { sep } from "@tauri-apps/api/path";
import { message } from "@tauri-apps/plugin-dialog";

import InteractivePath from "./InteractivePath";
import InputSuggestions from "./InputSuggestions";
import { joinCN } from "@utils";
import { useClickAway, useListenDragAndDrop } from "@hooks";
import { useExplorerHistory } from "@zustand";
import { canonicalize, pathExists } from "@tauriAPI";

import styles from "./PathInput.module.scss";

const PathInput: React.FC = () => {
    const { currentPath, pushRoute } = useExplorerHistory();

    const formRef = useRef<HTMLFormElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const inputContainerRef = useRef<HTMLDivElement | null>(null);
    const inputTextSizeTrackerRef = useRef<HTMLSpanElement | null>(null);

    const [inputValue, setInputValue] = useState(currentPath);
    const [focusOnList, setFocusOnList] = useState(false);
    const [isDropTarget, setIsDropTarget] = useState(false);
    const [isInputActive, setIsInputActive] = useState(false);
    const [inputTextWidth, setInputTextWidth] = useState(0);

    const fileDropTarget = "pathInput";

    const unmountClickAway = useClickAway(inputRef, () => setIsInputActive(false), ["mousedown"]);

    const handleSubmit: FormEventHandler<HTMLFormElement & { path: HTMLInputElement }> = async e => {
        e.preventDefault();

        const form = e.currentTarget;
        const isExists = await pathExists(inputValue);
        const normalizedPath = await canonicalize(inputValue);

        const resetInput = () => {
            inputRef.current?.blur();
            unmountClickAway();
            setIsInputActive(false);
        };

        if (normalizedPath === currentPath) {
            return resetInput();
        }

        if (!isExists) {
            message("This path doesn't exist", { kind: "error" });

            form.path.focus();

            return;
        }

        resetInput();
        pushRoute(normalizedPath);
        setInputValue(normalizedPath);
    };

    const handleChange: ChangeEventHandler<HTMLInputElement> = e => setInputValue(e.target.value);

    const handleSuggestionClick = (path: string) => {
        setInputValue(path);
        inputRef.current?.focus();
    };

    const handleInputKeydown: React.KeyboardEventHandler<HTMLInputElement> = e => {
        if (e.key === "Escape") {
            e.stopPropagation();
            e.preventDefault();

            if (inputValue === currentPath) {
                inputRef.current?.blur();
                unmountClickAway();
                setIsInputActive(false);
            } else {
                setInputValue(currentPath);
            }
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            e.stopPropagation();
            setFocusOnList(true);
        }
    };

    const handleInputFocus = () => {
        setFocusOnList(false);
        setIsInputActive(true);
    };

    const handleToggleInputFocusFromSuggestions = () => {
        setFocusOnList(false);
        inputRef.current?.focus();
        setTimeout(() =>
            inputRef.current?.setSelectionRange(inputValue.length, inputValue.length)
        );
    };

    const handleDropOver: DocumentEventHandler<"tauriDropOver"> = useCallback(e => {
        setIsDropTarget(e.detail === fileDropTarget);
    }, [fileDropTarget]);

    const handleDrop: DocumentEventHandler<"tauriDrop"> = useCallback(e => {
        setIsDropTarget(false);
        if (e.detail.target === fileDropTarget) {
            pushRoute(e.detail.paths[0]);
        }
    }, [pushRoute]);

    const handleDragCancel: DocumentEventHandler<"tauriDragCancel"> = useCallback(() => {
        setIsDropTarget(false);
    }, []);

    useListenDragAndDrop({
        onDragCancel: handleDragCancel,
        onDropOver: handleDropOver,
        onDrop: handleDrop
    });

    useLayoutEffect(() => {
        setInputTextWidth(inputTextSizeTrackerRef.current?.clientWidth || 0);
    }, [inputValue]);

    useEffect(() => setInputValue(currentPath), [currentPath]);

    const separator = sep();

    return (
        <form className={styles.wrapper} onSubmit={handleSubmit} ref={formRef}>
            <div
                ref={inputContainerRef}
                className={joinCN(styles.inputContainer, isDropTarget && styles.dropTarget)}
                data-current-path={currentPath}
                data-file-drop-target={fileDropTarget}
            >
                <span
                    ref={inputTextSizeTrackerRef}
                    className={styles.invisibleTextSizeTracker}
                >{inputValue.split(separator).slice(0, -1).join(separator)}\</span>

                <input
                    ref={inputRef}
                    type="text"
                    name="path"
                    autoComplete="off"
                    className={joinCN(styles.input, isInputActive && styles.inputActive)}
                    value={inputValue}
                    onKeyDown={handleInputKeydown}
                    onChange={handleChange}
                    onFocus={handleInputFocus}
                />

                {isInputActive && (
                    <InputSuggestions
                        onInputFocus={handleToggleInputFocusFromSuggestions}
                        left={inputTextWidth}
                        focusOnList={focusOnList}
                        onSelect={handleSuggestionClick}
                        pathForSuggestions={inputValue}
                    />
                )}

                {!isInputActive && <InteractivePath />}
            </div>
        </form>
    );
};

export default PathInput;
