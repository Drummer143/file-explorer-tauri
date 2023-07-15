import React, { useEffect } from "react";
import { getMatches } from "@tauri-apps/api/cli";

import Layout from "./components/Layout";
import { useNotificationStore } from "@zustand";

const App: React.FC = () => {
    const { addNotification } = useNotificationStore();

    useEffect(() => {
        document.addEventListener("keydown", async (e) => {
            if (e.code !== "KeyY") {
                return;
            }

            // const rng = Math.round(Math.random() * 1000) / 1000;

            // const type = rng < 0.34 ? "info" : rng < 0.67 ? "warn" : "error";

            const m = await getMatches();

            console.log(m);

            addNotification({
                message: JSON.stringify(m.args),
                reason: JSON.stringify(m.subcommand),
                type: "info"
            });
        });
    }, [addNotification]);

    return <Layout />;
};

export default App;
