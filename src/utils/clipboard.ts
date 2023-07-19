export const addFileInClipboard = (
    pathToCopiedFile: string,
    filename: string,
    filetype: string,
    action: "copy" | "cut"
) => {
    document.documentElement.dataset.copiedFileType = filetype;
    document.documentElement.dataset.copiedFilename = filename;
    document.documentElement.dataset.pathToCopiedFile = pathToCopiedFile;
    document.documentElement.dataset.clipboardAction = action;

    document.querySelector<HTMLElement>(".cut-file")?.classList.remove("cut-file");

    if (action === "cut") {
        document
            .querySelector<HTMLElement>(`[data-filename="${filename}"]`)?.classList.add("cut-file");
    }
};

export const clearClipboard = () => {
    document.documentElement.dataset.copiedFileType = undefined;
    document.documentElement.dataset.copiedFilename = undefined;
    document.documentElement.dataset.pathToCopiedFile = undefined;
    document.documentElement.dataset.clipboardAction = undefined;

    document.querySelector<HTMLElement>(".cut-file")?.classList.remove("cut-file");
};
