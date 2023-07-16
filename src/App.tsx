import React, { useEffect } from "react";
import { getMatches } from "@tauri-apps/api/cli";
import { WebviewWindow, getAll } from "@tauri-apps/api/window";

import Layout from "./components/Layout";
import { useNotificationStore } from "@zustand";

const App: React.FC = () => {
    const { addNotification } = useNotificationStore();

    useEffect(() => {
        const testKeyDown = async (e: KeyboardEvent) => {
            if (e.code !== "KeyY") {
                return;
            }

            // const rng = Math.round(Math.random() * 1000) / 1000;

            // const type = rng < 0.34 ? "info" : rng < 0.67 ? "warn" : "error";

            const m = await getMatches();

            console.info(m);

            addNotification({
                message: JSON.stringify(m.args),
                reason: JSON.stringify(m.subcommand),
                type: "info"
            });
        };

        document.addEventListener("keydown", testKeyDown);

        return () => {
            document.removeEventListener("keydown", testKeyDown);
        };
    }, [addNotification]);

    return <Layout />;
};

export default App;
