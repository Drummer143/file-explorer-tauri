import { create } from "zustand";
import { persist } from "zustand/middleware";
import { dirname } from "@tauri-apps/api/path";

interface ExplorerHistoryState {
    history: string[],
    canGoBack: boolean,
    canGoForward: boolean,
    currentPath: string,
    currentPathIndex: number
    hasParent: boolean

    pushRoute: (route: string) => void
    goBack: () => boolean
    goForward: () => boolean
    clear: () => void
    goToParent: () => void
}

export const useExplorerHistory = create<ExplorerHistoryState>()(
    persist((set, get) => ({
        canGoBack: false,
        canGoForward: false,
        currentPath: "",
        history: [""],
        currentPathIndex: 0,
        hasParent: false,

        pushRoute: (route) => {
            const { history, currentPathIndex } = get();

            const updatedHistory = history.slice(0, currentPathIndex + 1).concat(route);

            set({
                canGoBack: true,
                canGoForward: false,
                history: updatedHistory,
                currentPathIndex: currentPathIndex + 1,
                currentPath: route,
                hasParent: !!route
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
                currentPathIndex: newIndex,
                hasParent: !!history[newIndex]
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
                currentPathIndex: newIndex,
                hasParent: !!history[newIndex]
            })

            return true;
        },

        goToParent: async () => {
            const { hasParent, currentPath, history, currentPathIndex } = get();

            let parentDirectory: string 
            
            try {
                parentDirectory = await dirname(currentPath);
            } catch (error) {
                const pathWithoutDiskName = currentPath.split(":").at(1);

                if(!pathWithoutDiskName || pathWithoutDiskName === "\\") {
                    parentDirectory = "";
                } else {
                    throw new Error("Can't get parent directory");
                }
            }

            const updatedHistory = history.slice(0, currentPathIndex + 1).concat(parentDirectory);

            console.log(parentDirectory);

            set({
                canGoForward: false,
                history: updatedHistory,
                currentPathIndex: currentPathIndex + 1,
                currentPath: parentDirectory,
                hasParent: !!parentDirectory
            })
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
