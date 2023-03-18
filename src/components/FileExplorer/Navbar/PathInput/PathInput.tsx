import React, { useEffect, useRef, useState } from "react";

import useHistoryStore from "src/stores/historyStore";

import styles from './PathInput.module.scss';

type PathInputProps = {
    resizable: boolean

    setResizable: React.Dispatch<React.SetStateAction<boolean>>
}

const PathInput: React.FC<PathInputProps> = ({ resizable, setResizable }) => {
    const { pushRoute, currentPath } = useHistoryStore();

    const [input, setInput] = useState<string>(currentPath);

    const inputRef = useRef<HTMLInputElement>(null);
    const spanRef = useRef<HTMLSpanElement>(null);

    const handlePathInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
    };

    const handlePathInputEnterPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const newPath = input.replace('/', '\\');

        if (e.code === 'Enter' && currentPath !== newPath) {
            pushRoute(newPath);
            inputRef.current.blur();
        }
    };

    useEffect(() => {
        if (resizable) {
            inputRef.current.style.width = `calc(${spanRef.current.clientWidth}px + 20px + 2.5rem)`;
        }
    }, [input, resizable]);

    useEffect(() => setInput(currentPath), [currentPath]);

    return (
        <div ref={inputRef} className={'flex-grow min-w-[200px] transition-[width]'}>
            <span ref={spanRef} className={'absolute h-0 overflow-hidden whitespace-nowrap'}>
                {input}
            </span>

            <input
                value={input}
                onChange={handlePathInputChange}
                onKeyDown={handlePathInputEnterPress}
                onFocus={() => setResizable(true)}
                className={'text-[var(--secondary-text-dark)] w-full px-5 pt-1 pb-2 border-solid border border-transparent'
                    .concat(' text-center rounded-2xl leading-[3rem] transition-[border-color]')
                    .concat(' hover:border-[var(--top-grey-dark)]')
                    .concat(' focus:text-[var(--primary-text-dark)]')
                    .concat(' ', styles.pathInput)}
            />
        </div>
    );
}

export default PathInput;