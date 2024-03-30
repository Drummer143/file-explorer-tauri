import { create } from "zustand";

type StrSet = Set<string>;

interface FileSelectionState {
    selectedItems: StrSet;

    setSelectedItems: (items: StrSet | string[] | ((prev: StrSet) => StrSet)) => void;
    clearSelectedItems: () => void;
}

export const useFilesSelectionStore = create<FileSelectionState>((set, get) => ({
    selectedItems: new Set(),

    clearSelectedItems: () => set({ selectedItems: new Set() }),

    setSelectedItems: (value) => {
        const { selectedItems } = get();
        const newSelected: StrSet = typeof value === "function" ? value(selectedItems) : new Set(value);

        set({ selectedItems: newSelected });
    }
}));
