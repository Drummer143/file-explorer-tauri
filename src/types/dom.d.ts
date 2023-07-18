interface CustomEventMap {
    openEditFileModal: CustomEvent<{ filename: string }>;
    openExistFileModal: CustomEvent<{ dirname: string; filename: string }>;
    startTrackingClipboardAction: CustomEvent<{ eventId: number; filename: string; from: string; to: string }>;
    addNotification: CustomEvent<AppNotification>;
}

interface Document {
    addEventListener<T extends keyof CustomEventMap>(
        event: T,
        handler: (this: Document, e: CustomEventMap[T]) => void,
        options?: boolean | AddEventListenerOptions
    );

    removeEventListener<T extends keyof CustomEventMap>(
        type: T,
        listener: (this: Document, e: CustomEventMap[T]) => void,
        options?: boolean | EventListenerOptions
    );

    dispatchEvent<T extends keyof CustomEventMap>(e: CustomEventMap[T]);
}

type CustomEventHandler<T extends keyof CustomEventMap> = (event: CustomEventMap[T]) => void;
