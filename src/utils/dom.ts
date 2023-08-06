export const dispatchCustomEvent = <T extends keyof CustomEventMap>(
    eventName: T,
    detail: CustomEventMap[T]["detail"],
    eventProps: Omit<CustomEventInit, "detail"> = {}
) => {
    const event = new CustomEvent(eventName, { ...eventProps, detail });

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    document.dispatchEvent(event);
};

type LayerSwitchKeys = "shiftKey" | "ctrlKey" | "metaKey" | "altKey";

export const findActiveLayerKeys = (
    e: KeyboardEvent,
    searchIn: LayerSwitchKeys | LayerSwitchKeys[] = ["altKey", "ctrlKey", "metaKey", "shiftKey"]
) => {
    if (!Array.isArray(searchIn)) {
        searchIn = [searchIn];
    }

    const activeKeys = searchIn.filter(k => e[k]);

    return activeKeys;
};
