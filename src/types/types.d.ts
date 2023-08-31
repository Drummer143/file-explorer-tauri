type FileTypes = "disk" | "folder" | "file";

interface ExplorerFile {
    type: "file";
    subtype?: "image";
    name: string;
    size: number;
    readonly: boolean;
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

interface AppConfig {
    notification: {
        limit: number;
        tickspeed_ms: number;
        lifetime_ms: number;
    };
    filesystem: {
        file_size_in_trashcan_limit_in_bytes: number;
        copy_speed_limit_bytes_per_second: number;
        copy_buffer_size_bytes: number;
    };
}

interface CopiedFileInfo {
    files: PathsParts | PathsParts[];
    action: "cut" | "copy";
}

interface PathsParts {
    dirname: string
    filename: string;
}

interface PathsFromTo {
    from: string;
    to: string;
}
