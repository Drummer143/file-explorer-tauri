﻿import { RefObject, useEffect, useRef } from "react";

export const useClickAway = <E extends Event = Event>(
    ref: RefObject<HTMLElement | null>,
    onClickAway: (event: E) => void,
    events: (keyof MergedEventMap)[] = ["mousedown", "touchstart"]
) => {
    const savedCallback = useRef(onClickAway);

    useEffect(() => {
        savedCallback.current = onClickAway;
    }, [onClickAway]);

    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handler = (event: any) => {
            const { current: el } = ref;

            el && !el.contains(event.target) && savedCallback.current(event);
        };

        for (const eventName of events) {
            document.addEventListener(eventName, handler);
        }
        
        return () => {
            for (const eventName of events) {
                document.removeEventListener(eventName, handler);
            }
        };
    }, [events, ref]);
};
