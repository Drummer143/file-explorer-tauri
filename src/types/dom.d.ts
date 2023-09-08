declare global {
    const appConfig: AppConfig;

    interface OpenEditFileModalDetail {
        filetype: "file" | "folder";
        dirname: string;

        filename?: string;
    }

    type StartTrackingClipboardActionDetail = {
        eventId: number;
        action: "copy" | "cut";
    } & ({
        type: "file" | "folder";
        to: string;
        from: string;
        filename: string;
    } | {
        type: "multiple"
        paths: PathsFromTo[]
    })

    interface CustomEventMap {
        openEditFileModal: CustomEvent<OpenEditFileModalDetail>;
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
