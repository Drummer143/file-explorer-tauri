import { useEffect } from "react";
import { appWindow } from "@tauri-apps/api/window";

import Layout from "./components/Layout";
import { registerGlobalHotKeys } from "@utils";

const App: React.FC = () => {
    useEffect(() => {
        registerGlobalHotKeys();

        appWindow.isFocused().then(isFocused => {
            document.documentElement.classList.add(isFocused ? "appFocused" : "appBlurred");

            appWindow.onFocusChanged(() => {
                document.documentElement.classList.toggle("appBlurred");
                document.documentElement.classList.toggle("appFocused");
            });
        });
    }, []);

    return <Layout />;
};

export default App;
