import { create } from "zustand"


interface tauriFrontendStore {
    watcherId: number | undefined,

    setWatcherId: (id: number) => void
    deleteWatcherId: () => number | undefined
}

const useTauriFrontendStore = create<tauriFrontendStore>((set, get) => ({
    watcherId: undefined,

    setWatcherId: id => set(() => ({ watcherId: id })),

    deleteWatcherId: () => {
        const { watcherId } = get();

        if (!watcherId) {
            return undefined;
        }

        set(() => ({ watcherId: undefined }))

        return watcherId
    }
}))

export default useTauriFrontendStore;