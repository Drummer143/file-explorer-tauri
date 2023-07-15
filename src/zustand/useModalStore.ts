import { create } from "zustand";

type ModalTypes = "edit" | "exist";

interface FileEditModalState {
    targetFilename: string;
    type?: ModalTypes

    openModal: (type: ModalTypes, targetFilename: string) => void
    closeModal: () => void
}

export const useModalStore = create<FileEditModalState>((set) => ({
    targetFilename: "",

    openModal: (type, targetFilename) => set({ type, targetFilename }),

    closeModal: () => set({ type: undefined, targetFilename: "" })
}));
