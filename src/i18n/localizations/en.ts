export default {
    translation: {
        navbar: {
            back: "Back",
            forward: "Forward",
            goToParentFolder: "Go to parent folder",
            reload: "Reload"
        },
        windowControlButtons: {
            minimize: "Minimize",
            restoreToWindow: "Restore to window",
            maximize: "Maximize",
            close: "Close"
        },
        ctx: {
            paste: "Paste",
            copy: "Copy",
            cut: "Cut",
            openInNativeExplorer: "Open in explorer",
            showInNativeExplorer: "Show in explorer",
            open: "Open",
            delete: "Delete",
            rename: "Rename"
        },
        clipboardTrackers: {
            copyingFileFromTo: "Copying {{filename}} from {{from}} to {{to}}",
            cancelCopying: "Cancel copying",
            continueCopying: "Continue copying",
            pauseCopying: "Pause copying",
            deleteCopiedFile: "Delete copied file?",
            deleteFile: "Delete file",
            saveFile: "Save file"
        },
        modals: {
            editFileModal: {
                heading: "Editing {{filename}}",
                nameInputLabel: "Name"
            },
            fileExistModal: {
                modalText: "{{filename}} already exists in {{targetFolder}}. Choose an action:",
                overwrite: "Overwrite",
                saveBoth: "Save both"
            }
        },
        notifications: {
            error: "Error",
            info: "Info",
            warning: "Warning"
        },
        save: "Save",
        cancel: "Cancel",
        close: "Close"
        // enterFileName: "Enter file name",
        // enterFolderName: "Enter folder name",
        // create: "Create",
        // newFolder: "New folder",
        // newFile: "New file",
        // settings: "Settings",
        // language: "Language",
        // title: "File Explorer",
        // explorerErrors: {
        //     invalidPath: "Can't find !<path!<. Check correctness of the path",
        //     onOpenFile: "Can't open file",
        //     onGetInfo: "Can't get information about file"
        // },
        // ctx: {
        //     buttons: {
        //         openFile: "Open file",
        //         openFolder: "Open folder",
        //         delete: "Delete",
        //         rename: "Rename",
        //         createFolder: "Create folder",
        //         createFile: "Create file",
        //         openInExplorer: "Open in Windows explorer",
        //         appearance: "Appearance"
        //     },
        //     sections: {
        //         disk: "disk",
        //         directory: "directory",
        //         file: "file",
        //         explorer: "explorer"
        //     }
        // },
    }
} as LocalizationMap;
