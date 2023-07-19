declare global {
    const appConfig: AppConfig;

    interface OpenEditFileModalDetail {
        filename: string
    }

    interface OpenExistFileModalDetail {
        dirname: string;
        filename: string
    }

    interface StartTrackingClipboardActionDetail {
        eventId: number;
        filename: string;
        from: string;
        to: string;
        action: "copy" | "cut"
    }

    interface CustomEventMap {
        openEditFileModal: CustomEvent<OpenEditFileModalDetail>;
        openExistFileModal: CustomEvent<OpenExistFileModalDetail>;
        startTrackingClipboardAction: CustomEvent<StartTrackingClipboardActionDetail>;
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

    interface Window {
        appConfig: AppConfig;
    }
}

export { };
