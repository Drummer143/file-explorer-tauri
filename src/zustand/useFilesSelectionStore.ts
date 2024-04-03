import { create } from "zustand";

interface FileSelectionState {
    selectedItems: string[];

    setSelectedItems: (items: string[] | ((prev: string[]) => string[])) => void;
    clearSelectedItems: () => void;
}

export const useFilesSelectionStore = create<FileSelectionState>((set, get) => ({
    selectedItems: [],

    clearSelectedItems: () => set({ selectedItems: [] }),

    setSelectedItems: (value) => {
        const { selectedItems } = get();
        const newSelected: string[] = typeof value === "function" ? value(selectedItems) : value;

        set({ selectedItems: newSelected });
    }
}));
