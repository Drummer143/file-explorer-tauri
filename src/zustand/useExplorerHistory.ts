import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ExplorerHistoryState {
    history: string[],
    canGoBack: boolean,
    canGoForward: boolean,
    currentPath: string,
    currentPathIndex: number

    pushRoute: (route: string) => void
    goBack: () => boolean
    goForward: () => boolean
    clear: () => void
}

export const useExplorerHistory = create<ExplorerHistoryState>()(
    persist((set, get) => ({
        canGoBack: false,
        canGoForward: false,
        currentPath: "",
        history: [""],
        currentPathIndex: 0,

        pushRoute: (route) => {
            const { history, currentPathIndex } = get();

            const updatedHistory = history.slice(0, currentPathIndex + 1).concat(route);

            set({
                canGoBack: true,
                canGoForward: false,
                history: updatedHistory,
                currentPathIndex: currentPathIndex + 1,
                currentPath: route
            })
        },

        goBack: () => {
            const { canGoBack, currentPathIndex, history } = get();

            if (!canGoBack) {
                console.error("Can't go back");
                return false;
            }

            const newIndex = currentPathIndex - 1;

            set({
                currentPath: history[newIndex],
                canGoBack: newIndex > 0,
                canGoForward: true,
                currentPathIndex: newIndex
            })

            return true;
        },

        goForward: () => {
            const { canGoForward, currentPathIndex, history } = get();

            if (!canGoForward) {
                console.error("Can't go forward");
                return false;
            }

            const newIndex = currentPathIndex + 1;

            set({
                currentPath: history[newIndex],
                canGoForward: history.length - 1 > newIndex,
                canGoBack: true,
                currentPathIndex: newIndex
            })

            return true;
        },

        clear: () => {
            console.warn("Clearing history");

            set({
                canGoBack: false,
                canGoForward: false,
                currentPath: "",
                currentPathIndex: 0,
                history: [""]
            })
        }
    }), {
        name: "store:history",
        version: 1
    })
)
