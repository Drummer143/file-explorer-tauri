type FileTypes = "disk" | "folder" | "file" | "image";

interface ExplorerFile {
    type: "file" | "image";
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

    reason?: string
}

interface ErrorMessage {
    message?: string
    error?: string
}
