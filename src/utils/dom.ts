export const dispatchCustomEvent = <T extends keyof CustomEventMap>(
    eventName: T,
    detail: CustomEventMap[T]["detail"],
    eventProps?: Omit<CustomEventInit, "detail">
) => {
    eventProps ??= {};

    const event = new CustomEvent(eventName, { ...eventProps, detail });

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    document.dispatchEvent(event);
};
