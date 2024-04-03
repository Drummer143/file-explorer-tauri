import { sep } from "@tauri-apps/api/path";
import { create } from "zustand";
// import { persist } from "zustand/middleware";

import { dirname } from "@tauriAPI";

type HistoryUpdateType = "back" | "forward" | "push" | "init";

interface ExplorerHistoryState {
    history: string[];
    canGoBack: boolean;
    canGoForward: boolean;
    currentPath: string;
    currentPathIndex: number;
    hasParent: boolean;
    lastHistoryUpdateType: HistoryUpdateType;

    prevTargetFile?: string;

    pushRoute: (route: string) => void;
    goBack: () => boolean;
    goForward: () => boolean;
    clear: () => void;
    goToParent: () => void;
}

export const useExplorerHistory = create<ExplorerHistoryState>()(
    /* persist( */(set, get) => ({
        canGoBack: false,
        canGoForward: false,
        currentPath: "",
        history: [""],
        currentPathIndex: 0,
        hasParent: false,
        lastHistoryUpdateType: "init",

        pushRoute: route => {
            const { history, currentPathIndex, currentPath } = get();

            if (route === currentPath) {
                return;
            }

            const updatedHistory = history.slice(0, currentPathIndex + 1).concat(route);

            set({
                canGoBack: true,
                canGoForward: false,
                history: updatedHistory,
                currentPathIndex: currentPathIndex + 1,
                currentPath: route,
                hasParent: !!route,
                lastHistoryUpdateType: "push",
                prevTargetFile: undefined
            });
        },

        goBack: () => {
            const { canGoBack, currentPathIndex, history, currentPath } = get();

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
                hasParent: !!history[newIndex],
                lastHistoryUpdateType: "back",
                prevTargetFile: currentPath.split(sep).at(-1)
            });

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
                hasParent: !!history[newIndex],
                lastHistoryUpdateType: "forward",
                prevTargetFile: history[newIndex + 1]?.split(sep).at(-1)
            });

            return true;
        },

        goToParent: async () => {
            const { currentPath, history, currentPathIndex } = get();

            let parentDirectory: string;

            try {
                parentDirectory = await dirname(currentPath);

                if (parentDirectory.endsWith(sep)) {
                    parentDirectory = parentDirectory.slice(0, -1);
                }
            } catch (error) {
                return console.error(error);
            }

            const updatedHistory = history.slice(0, currentPathIndex + 1).concat(parentDirectory);

            set({
                canGoForward: false,
                history: updatedHistory,
                currentPathIndex: currentPathIndex + 1,
                currentPath: parentDirectory,
                hasParent: !!parentDirectory
            });
        },

        clear: () => {
            console.warn("Clearing history");

            set({
                canGoBack: false,
                canGoForward: false,
                currentPath: "",
                currentPathIndex: 0,
                history: [""]
            });
        }
    }) /* , {
        name: "store:history",
        version: 1
    }) */
);
