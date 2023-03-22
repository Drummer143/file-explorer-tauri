import { create } from "zustand"

export interface FileExplorerStore {
    files: CFile[]
    isWaitingNewFiles: boolean

    currentEditingFile?: string

    setFiles: (files: CFile[] | ((oldFiles: CFile[]) => CFile[])) => void
    setCurrentEditingFile: (filename?: string) => void
    setIsWaitingNewFiles: (value: boolean) => void
    addFiles: (file: CFile | CFile[]) => void
}

const useFileExplorerState = create<FileExplorerStore>((set, get) => ({
    files: [],
    isWaitingNewFiles: true,

    setCurrentEditingFile: filename => set({ currentEditingFile: filename }),
    setFiles: value => {
        let files: CFile[];

        if (Array.isArray(value)) {
            files = value;
        } else {
            files = value(files);
        }

        set({ files, isWaitingNewFiles: false })
    },
    setIsWaitingNewFiles: (value) => set({ isWaitingNewFiles: value }),
    addFiles: (files) => {
        set((state) => ({ files: state.files.concat(files) }))
    }
}))

export default useFileExplorerState;