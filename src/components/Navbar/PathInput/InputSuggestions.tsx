import React, { useEffect, useRef, useState } from "react";
import { sep } from "@tauri-apps/api/path";

import Scrollbars from "../../Scrollbars";
import { getNestedDirnames } from "@tauriAPI";

import styles from "./PathInput.module.scss";

type InputSuggestionsProps = {
    left: number;
    focusOnList: boolean;
    pathForSuggestions: string;

    onSelect: (path: string) => void;
    onInputFocus: () => void;
};

const InputSuggestions: React.FC<InputSuggestionsProps> = ({
    pathForSuggestions,
    onInputFocus,
    focusOnList,
    onSelect,
    left
}) => {
    const [suggestedPaths, setSuggestedPaths] = useState<string[] | undefined>();
    const [focusedSuggestion, setFocusedSuggestion] = useState(-1);
    const [filteredSuggestedPaths, setFilteredSuggestedPaths] = useState<string[] | undefined>();

    const suggestionListRef = useRef<HTMLDivElement | null>(null);

    const getSuggestedPaths = async (path: string) => {
        if (!path) {
            return;
        }

        try {
            const splittedPath = path.split(sep);
            const targetPath = splittedPath.at(-1) ? splittedPath.slice(0, -1).join(sep) : path;
            const dirs = await getNestedDirnames(targetPath);

            setSuggestedPaths(dirs);

            if (!path.endsWith(sep)) {
                const currentDirName = path.split(sep).pop()?.toLowerCase() || "";
                const filtered = dirs.filter((suggestion) => suggestion.toLowerCase().startsWith(currentDirName));

                if (filtered.length) {
                    setFilteredSuggestedPaths(filtered);
                } else {
                    setFilteredSuggestedPaths(undefined);
                }
            } else {
                setFilteredSuggestedPaths(undefined);
            }
        } catch {
            setSuggestedPaths(undefined);
            setFilteredSuggestedPaths(undefined);
        }
    };

    const onSuggestionClick = (suggestion: string) => {
        setFilteredSuggestedPaths(undefined);
        setSuggestedPaths(undefined);
        onSelect(`${pathForSuggestions.split(sep).slice(0, -1).join(sep)}${sep}${suggestion}`);
    };

    const onListKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
        if (e.key === "ArrowDown") {
            setFocusedSuggestion(Math.min(focusedSuggestion + 1, (suggestedPaths?.length || 1) - 1));
        } else if (e.key === "ArrowUp") {
            if (focusedSuggestion === 0) {
                onInputFocus();
                setFocusedSuggestion(-1);
            } else {
                setFocusedSuggestion(focusedSuggestion - 1);
            }
        }
    };

    useEffect(() => {
        if (focusOnList) {
            setFocusedSuggestion(0);
        } else {
            setFocusedSuggestion(-1);
        }
    }, [focusOnList]);

    useEffect(() => {
        getSuggestedPaths(pathForSuggestions);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathForSuggestions]);

    if (!suggestedPaths) {
        return null;
    }

    return (
        <div className={styles.inputSuggestions} style={{ left }}>
            <Scrollbars className={styles.scrollBar}>
                <div className={styles.suggestionList} ref={suggestionListRef} onKeyDown={onListKeyDown}>
                    {(filteredSuggestedPaths || suggestedPaths).map((suggestion, i) => (
                        <button
                            title={suggestion}
                            ref={ref => i === focusedSuggestion && ref?.focus()}
                            type="button"
                            className={styles.suggestion}
                            key={suggestion}
                            onClick={() => onSuggestionClick(suggestion)}
                        >
                            {suggestion}
                        </button>
                    ))}
                </div>
            </Scrollbars>
        </div>
    );
};

export default InputSuggestions;