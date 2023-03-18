import { create } from 'zustand';

export interface HistoryStore {
    history: string[];
    currentPath: string;
    currentPathIndex: number;

    reset: () => void;
    pushRoute: (newPath: string) => void;
    goBack: () => string;
    goForward: () => string;
    deleteLastRoute: () => void
}

const useHistoryStore = create<HistoryStore>((set, get) => ({
    history: [''],
    currentPath: '',
    currentPathIndex: 0,

    pushRoute: newPath => set(state => ({
            history: state.history.slice(0, state.currentPathIndex + 1).concat(newPath),
            currentPath: newPath,
            currentPathIndex: state.currentPathIndex + 1
        })),

    goBack: () => {
        if (get().currentPathIndex - 1 < 0) {
            return;
        }

        set(state => ({
            currentPath: state.history[state.currentPathIndex - 1] || '',
            currentPathIndex: state.currentPathIndex - 1
        }));

        return get().currentPath;
    },

    goForward: () => {
        const { history, currentPathIndex } = get();
        if (currentPathIndex === history.length - 1) {
            return;
        }

        set(state => ({
            currentPathIndex: state.currentPathIndex + 1,
            currentPath: state.history[currentPathIndex + 1]
        }));

        return get().currentPath;
    },

    deleteLastRoute: () => {
        const { history: h } = get();

        const history = h.slice(0, -1);
        let currentPath = history.at(-1);
        let currentPathIndex = history.length;

        set(() => ({
            history,
            currentPath,
            currentPathIndex
        }))
    },

    reset: () => set(() => ({ history: [], currentPath: '' }))
}));

export default useHistoryStore;
