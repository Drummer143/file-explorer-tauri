// CMC - context menu communication

import { create } from "zustand";

export type ModalInfo = {
    name: 'fileCreating'
    data: FileCreatingModalParams
}

export interface CMCStore {
    currentEditingFile?: string
    modalInfo?: ModalInfo

    setCurrentEditingFile: (filename: string) => void
    setModal: (options?: ModalInfo) => void
}

const useCMCStore = create<CMCStore>((set, get) => ({
    setCurrentEditingFile: filename => set({ currentEditingFile: filename }),

    setModal: (options?: ModalInfo) => set({
        modalInfo: options
    })
}))

export default useCMCStore;