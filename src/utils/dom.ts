export const dispatchCustomEvent = <T extends keyof CustomEventMap>(
    eventName: T,
    detail?: CustomEventMap[T]["detail"],
    eventProps?: Omit<CustomEventInit, "detail">
) => {
    eventProps ??= {};

    const event = new CustomEvent(eventName, { detail, ...eventProps });

    document.dispatchEvent(event);
};
