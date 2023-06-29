import { useEffect, useMemo } from "react";

type UseResizeObserverProps = {
    target?: HTMLElement | null;

    onResize: ResizeObserverCallback;
};

export const useResizeObserver = ({ onResize, target }: UseResizeObserverProps) => {
    const resizeObserver = useMemo(() => new ResizeObserver(onResize), [onResize]);

    useEffect(() => {
        if (!target) {
            return;
        }

        resizeObserver.observe(target);

        return () => {
            resizeObserver.unobserve(target);
        };
    }, [resizeObserver, target]);
};
