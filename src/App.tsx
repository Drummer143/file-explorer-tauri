import React, { useEffect } from "react";
import { appWindow } from "@tauri-apps/api/window";

import Layout from "./components/Layout";

const App: React.FC = () => {
    useEffect(() => {
        appWindow.isFocused().then(isFocused => {
            document.documentElement.classList.add(isFocused ? "appFocused" : "appBlurred");

            appWindow.onFocusChanged((e) => {
                document.documentElement.classList.toggle("appBlurred");
                document.documentElement.classList.toggle("appFocused");
            });
        });
    }, []);

    return <Layout />;
};

export default App;
