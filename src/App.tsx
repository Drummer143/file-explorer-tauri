import React, { useEffect } from "react";

import Layout from "./components/Layout";
import { useNotificationStore } from "@zustand";

const App: React.FC = () => {
    const { addNotification } = useNotificationStore();

    useEffect(() => {
        document.addEventListener("keydown", e => {
            const rng = Math.round(Math.random() * 1000) / 1000;

            const type = rng < 0.34 ? "info" : rng < 0.67 ? "warn" : "error";

            if (e.code === "KeyY") {
                addNotification({
                    message: rng + " message",
                    type: type
                });
            }
        });
    }, [addNotification]);

    return <Layout />;
};

export default App;
