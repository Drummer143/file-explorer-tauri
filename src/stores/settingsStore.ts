import { create } from 'zustand';

export interface SettingsStore {
    isOpened?: boolean
    activeSection?: string;

    toggleOpened: (value?: boolean | ((prev?: boolean) => boolean)) => void
    setActiveSection: (sectionName?: string) => void;
}

const useSettingsStore = create<SettingsStore>((set, get) => ({
    setActiveSection: (sectionName) => set({ activeSection: sectionName }),

    toggleOpened: (value) => {
        const { isOpened } = get();

        if (typeof value === 'function') {
            value = value(isOpened);
        }

        set({ isOpened: value })
    }
}))

export default useSettingsStore;