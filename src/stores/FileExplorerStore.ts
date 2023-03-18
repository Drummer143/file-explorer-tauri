import { create } from "zustand"

export interface FileExplorerStore {
    files: CFile[]
    isWaitingNewFiles: boolean

    currentEditingFile?: string

    setFiles: (files: CFile[]) => void
    setCurrentEditingFile: (filename?: string) => void
    setIsWaitingNewFiles: (value: boolean) => void
}

const useFileExplorerState = create<FileExplorerStore>((set) => ({
    files: [],
    isWaitingNewFiles: true,

    setCurrentEditingFile: filename => set({ currentEditingFile: filename }),
    setFiles: files => set({ files, isWaitingNewFiles: false }),
    setIsWaitingNewFiles: (value) => set({ isWaitingNewFiles: value })
}))

export default useFileExplorerState;