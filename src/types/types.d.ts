type FileTypes = "disk" | "folder" | "file";

interface ExplorerFile {
    type: "file";
    subtype?: "image"
    name: string;
    size: number;
    isRemovable: boolean;
}

interface ExplorerDirectory {
    type: "folder";
    name: string;
    isRemovable: boolean;
}

interface ExplorerDisk {
    type: "disk";
    name: string;
    mountPoint: string;
    availableSpace: number;
    totalSpace: number;
    isRemovable: boolean;
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
    dirname: string;
    filename: string;
    filetype: Exclude<FileTypes, "disk">
    action: "cut" | "copy"
}
