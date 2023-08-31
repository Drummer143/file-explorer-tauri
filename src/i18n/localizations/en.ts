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
            rename: "Rename",
            createNewFile: "Create new file",
            createNewFolder: "Create new folder"
        },
        clipboardTrackers: {
            copyingFileFromTo: "Copying {{filename}} from {{from}} to {{to}}",
            movingFileFromTo: "Moving {{filename}} from {{from}} to {{to}}",
            alreadyExists: "{{filename}} already exists. Choose an action:",
            cancel: "Cancel",
            continue: "Continue copying",
            skipFile: "Skip",
            pause: "Pause copying",
            deleteCopiedFile: "Delete copied file?",
            deleteFile: "Delete file",
            saveFile: "Save file",
            overwrite: "Overwrite",
            saveBoth: "Save both",
            merge: "Merge",
            doThisForAllFiles: "Do this for all files",
            preparingToCopyFolder: "Preparing to copy folder",
            actionRequired: "Action required"
        },
        modals: {
            editFileModal: {
                editingHeading: "Editing {{filename}}",
                nameInputLabel: "Name",
                extensionInputLabel: "Extension",
                fileCreatingHeading: "Creating new file",
                folderCreatingHeading: "Creating new folder",
                submitButton: "Save",
                errors: {
                    alreadyTaken: "This name is already taken",
                    emptyName: "Filename can't be empty"
                }
            },
            fileExistModal: {
                modalText: "{{filename}} already exists in {{targetFolder}}. Choose an action:",
                overwrite: "Overwrite",
                saveBoth: "Save both",
                merge: "Merge"
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
    }
};
