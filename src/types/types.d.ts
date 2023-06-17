type FileTypes = "disk" | "directory" | "file"

type CFile = {
    name: string
} & ({
    type: Exclude<FileTypes, "disk">
    size: number
    type: FileTypes
} | {
    type: "disk"
    mountPoint: string
    availableSpace: number
    totalSpace: number
})

type CFileDisk = CFile & { type: "disk" };
type CFileFileDirectory = CFile & { type: "directory" | "file" };
