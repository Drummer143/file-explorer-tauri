type ContextMenuKeys =
    | "paste"
    | "copy"
    | "cut"
    | "openInNativeExplorer"
    | "showInNativeExplorer"
    | "open"
    | "delete"
    | "rename";

type LocalizationMap = {
    translation: {
        navbar: {
            back: string;
            forward: string;
            goToParentFolder: string;
            reload: string;
        };
        windowControlButtons: {
            minimize: string;
            restoreToWindow: string;
            maximize: string;
            close: string;
        };
        ctx: {
            [key in ContextMenuKeys]: string;
        };
        clipboardTrackers: {
            copyingFileFromTo: string;
            pauseCopying: string;
            continueCopying: string;
            cancelCopying: string;
            deleteCopiedFile: string;
            deleteFile: string;
            saveFile: string;
        };
        modals: {
            editFileModal: {
                heading: string;
                nameInputLabel: string;
            };
            fileExistModal: {
                modalText: string;
                overwrite: string;
                saveBoth: string;
            };
        };
        notifications: {
            error: string;
            warning: string;
            info: string;
        };
        save: string;
        cancel: string;
        close: string;
    };
};
