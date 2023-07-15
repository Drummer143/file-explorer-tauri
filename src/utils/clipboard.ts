import { sep } from "@tauri-apps/api/path";

export const copyFile = (copiedFile: string, filetype: string) => {
    document.documentElement.dataset.copiedFileType = filetype;
    document.documentElement.dataset.copiedFile = copiedFile;
    document.documentElement.dataset.clipboardAction = "copy";
    document.querySelector<HTMLElement>(".cut-file")?.classList.remove("cut-file");
};

export const cutFile = (dirname: string, filename: string, filetype: string) => {
    document.documentElement.dataset.copiedFileType = filetype;
    document.documentElement.dataset.copiedFile = dirname + sep + filename;
    document.documentElement.dataset.clipboardAction = "cut";
    document.querySelector<HTMLElement>(".cut-file")?.classList.remove("cut-file");
    document.querySelector<HTMLElement>(`[data-context-menu-additional-info="${filename}"]`)?.classList.add("cut-file");
};
