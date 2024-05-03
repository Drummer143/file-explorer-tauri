import { proxy } from "valtio";
import { devtools } from "valtio/utils";
import { useEffect, useState } from "react";
import { PhysicalPosition, getCurrent } from "@tauri-apps/api/window";

import Layout from "./components/Layout";
import { getConfig } from "./tauriAPIWrapper/cfs";
import { dispatchCustomEvent } from "@utils";

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

        const appWindow = getCurrent();

        appWindow.onDragDropEvent(event => {
            const isPhysicalPosition = (payload: unknown): payload is PhysicalPosition => {
                return payload instanceof PhysicalPosition;
            };

            const isPathArray = (payload: unknown): payload is string[] => {
                return Array.isArray(payload);
            };

            const getTarget = () => {
                const position = (event.payload as { position: unknown }).position;

                if (!isPhysicalPosition(position)) {
                    return;
                }

                const target = (
                    document
                        .elementsFromPoint(position.x, position.y)
                        .find(el => (el as HTMLElement | null)?.dataset.fileDropTarget) as HTMLElement | null
                )?.dataset.fileDropTarget;

                return target;
            };

            switch (event.event) {
                case "tauri://drag-cancelled":
                    dispatchCustomEvent("tauriDragCancel", undefined);
                    break;
                case "tauri://drop": {
                    const paths = (event.payload as { paths: unknown }).paths;

                    if (!isPathArray(paths)) {
                        return;
                    }

                    dispatchCustomEvent("tauriDrop", { target: getTarget(), paths });
                    break;
                }
                case "tauri://drop-over": {
                    dispatchCustomEvent("tauriDropOver", getTarget());
                    break;
                }
                case "tauri://drag": {
                    //handle drag enter
                    break;
                }
                default:
                    console.error("unhandled drag and drop event", event);
            }
        });

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
