import { v4 } from "uuid";
import { unregisterAll, register } from "@tauri-apps/plugin-global-shortcut";
import { window } from "@tauri-apps/api";

export const registerGlobalHotKeys = () => unregisterAll()
    .then(() => {
        register("CommandOrControl+Shift+N", () => {
            const appWindow = new window.Window("main" + v4(), {
                focus: false,
                decorations: false,
                fullscreen: false,
                height: 600,
                resizable: true,
                title: "file-explorer",
                width: 800
            });

            appWindow.requestUserAttention(window.UserAttentionType.Critical);
        });
    });
    // .then(() => console.log("listeners installed"));
