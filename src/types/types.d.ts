type FileTypes = "disk" | "directory" | "file";

interface ExplorerFile {
    type: "file";
    name: string;
    size: number;
}

interface ExplorerDirectory {
    type: "directory";
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
