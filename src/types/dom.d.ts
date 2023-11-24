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

    type MergedEventMap = CustomEventMap & DocumentEventMap;

    interface Document {
        addEventListener<T extends keyof MergedEventMap>(
            event: T,
            handler: (this: Document, e: MergedEventMap[T]) => void,
            options?: boolean | AddEventListenerOptions
        );

        removeEventListener<T extends keyof MergedEventMap>(
            type: T,
            listener: (this: Document, e: MergedEventMap[T]) => void,
            options?: boolean | EventListenerOptions
        );

        dispatchEvent<T extends keyof MergedEventMap>(e: MergedEventMap[T]);
    }

    type DocumentEventHandler<T extends keyof MergedEventMap = MergedEventMap> = (event: MergedEventMap[T]) => void;

    interface Window {
        appConfig: IAppConfig;
    }
}

export { };
