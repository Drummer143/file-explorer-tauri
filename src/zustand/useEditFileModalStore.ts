import { create } from "zustand";

interface FileEditModalState {
    isOpened: boolean;
    editFilename: string;

    openModal: (editFilename: string) => void
    closeModal: () => void
}

export const useEditFileModalStore = create<FileEditModalState>((set) => ({
    isOpened: false,
    editFilename: "",

    openModal: (editFilename) => set({ isOpened: true, editFilename }),

    closeModal: () => set({ isOpened: false, editFilename: "" })
}));
