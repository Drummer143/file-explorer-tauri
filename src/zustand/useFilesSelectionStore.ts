import { create } from "zustand";

interface FileSelectionState {
    selectedItems: string[];
    firstSelected?: string;

    setSelectedItems: (items: string[] | ((prev: string[]) => string[])) => void;
    clearSelectedItems: () => void;
    setFirstSelected: (item: string) => void;
    getSelectedItems: () => string[]
}

export const useFilesSelectionStore = create<FileSelectionState>((set, get) => ({
    selectedItems: [],

    clearSelectedItems: () => set({ selectedItems: [], firstSelected: undefined }),

    setSelectedItems: (value) => {
        const { selectedItems: prevSelectedItems, firstSelected: prevFirstSelected } = get();
        const newSelected = Array.isArray(value) ? value : value(prevSelectedItems);
        let firstSelected = prevFirstSelected;

        if (!prevSelectedItems.length && newSelected.length === 1) {
            firstSelected = newSelected[0];
        }

        set({ selectedItems: newSelected, firstSelected });
    },

    setFirstSelected: (item) => {
        set({ firstSelected: item, selectedItems: [item] });
    },

    getSelectedItems: () => get().selectedItems
}));
