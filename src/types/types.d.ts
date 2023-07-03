type FileTypes = "disk" | "folder" | "file" | "image";

interface ExplorerFile {
    type: "file" | "image";
    name: string;
    size: number;
}

interface ExplorerDirectory {
    type: "folder";
    name: string;
}

interface ExplorerDisk {
    type: "disk";
    name: string;
    mountPoint: string;
    availableSpace: number;
    totalSpace: number;
}

type CFile = ExplorerDirectory | ExplorerDisk | ExplorerFile;

interface AppNotification {
    message: string;
    type: "info" | "warn" | "error";

    reason?: string
}

interface ErrorMessage {
    message?: string
    error?: string
}
