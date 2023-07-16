interface CustomEventMap {
    "openEditFileModal": CustomEvent<{ filename: string }>;
    "openExistFileModal": CustomEvent<{ dirname: string, filename: string }>
}

interface Document {
    addEventListener<T extends keyof CustomEventMap>(
        event: T,
        handler: (this: Document, e: CustomEventMap[T]) => void, options?: boolean | AddEventListenerOptions
    );

    removeEventListener<T extends keyof CustomEventMap>(
        type: T,
        listener: (this: Document, e: CustomEventMap[T]) => void, options?: boolean | EventListenerOptions
    );

    dispatchEvent<T extends keyof CustomEventMap>(e: CustomEventMap[T]);
}
