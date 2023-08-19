import React, { useEffect } from "react";
import { appWindow } from "@tauri-apps/api/window";

import Layout from "./components/Layout";

const App: React.FC = () => {
    useEffect(() => {
        appWindow.isFocused().then(isFocused => {
            document.documentElement.classList.add(isFocused ? "appFocused" : "appBlurred");

            appWindow.listen("tauri://focus", () => document.documentElement.classList.replace("appBlurred", "appFocused"));
            appWindow.listen("tauri://blur", () => document.documentElement.classList.replace("appFocused", "appBlurred"));
        })
    }, []);

    return <Layout />;
};

export default App;
