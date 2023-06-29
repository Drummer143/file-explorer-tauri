type LocalizationMap = {
    translation: {
        enterFileName: string;
        enterFolderName: string;
        create: string;
        newFolder: string;
        newFile: string;
        settings: string;
        language: string;
        title: string;
        explorerErrors: {
            invalidPath: string;
            onOpenFile: string;
            onGetInfo: string;
        };
        ctx: {
            buttons: {
                openFile: string;
                openFolder: string;
                delete: string;
                rename: string;
                createFolder: string;
                createFile: string;
                openInExplorer: string;
                appearance: string;
            };
            sections: {
                disk: string;
                directory: string;
                file: string;
                explorer: string;
            };
        };
        windowControlButtons: {
            minimize: string;
            restoreToWindow: string;
            maximize: string;
            close: string;
        };
    };
};
