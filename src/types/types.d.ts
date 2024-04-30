type FileTypes = "disk" | "folder" | "file" | "unknown";

interface ExplorerFile {
    type: "file";
    name: string;
    size: number;
    readonly: boolean;

    ext?: string;
    subtype?: "image";
}

interface ExplorerDirectory {
    type: "folder";
    name: string;
    readonly: boolean;
}

interface ExplorerDisk {
    type: "disk";
    name: string;
    mountPoint: string;
    availableSpace: number;
    totalSpace: number;
    readonly: boolean;
}

type CFile = ExplorerDirectory | ExplorerDisk | ExplorerFile;

interface AppNotification {
    message: string;
    type: "info" | "warn" | "error";

    reason?: string;
}

interface ErrorMessage {
    message?: string;
    error?: string;
}

interface CopiedFileInfo {
    files: PathsParts | PathsParts[];
    action: "cut" | "copy";
}

interface PathsParts {
    dirname: string;
    filename: string;
}

interface PathsFromTo {
    from: string;
    to: string;
}
