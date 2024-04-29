import { proxy } from "valtio";
import { devtools } from "valtio/utils";
import { getCurrent } from "@tauri-apps/api/window";
import { unregisterAll } from "@tauri-apps/plugin-global-shortcut";
import { useEffect, useState } from "react";

import Layout from "./components/Layout";
import { getConfig } from "./tauriAPIWrapper/cfs";
import { registerGlobalHotKeys } from "@utils";

const App: React.FC = () => {
    const [isConfigLoading, setIsConfigLoading] = useState(true);

    useEffect(() => {
        getConfig()
            .then(config => {
                window.appConfig = proxy(config);

                devtools(appConfig, { name: "appConfig" });

                setIsConfigLoading(false);
            })
            .catch(console.info);

        unregisterAll()
            .then(registerGlobalHotKeys)
            .catch(registerGlobalHotKeys);

        const appWindow = getCurrent();

        appWindow.isFocused().then(isFocused => {
            document.documentElement.classList.add(isFocused ? "appFocused" : "appBlurred");

            appWindow.onFocusChanged(() => {
                document.documentElement.classList.toggle("appBlurred");
                document.documentElement.classList.toggle("appFocused");
            });
        });
    }, []);

    if (isConfigLoading) {
        return "Loading";
    }

    return <Layout />;
};

export default App;
