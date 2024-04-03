import { v4 } from "uuid";
import { unregisterAll, register } from "@tauri-apps/api/globalShortcut";
import { WebviewWindow, UserAttentionType } from "@tauri-apps/api/window";

export const registerGlobalHotKeys = () => unregisterAll()
    .then(() => {
        register("CommandOrControl+Shift+N", () => {
            const window = new WebviewWindow("main" + v4(), {
                url: location.href,
                focus: false,
                decorations: false,
                "fullscreen": false,
                "height": 600,
                "resizable": true,
                "title": "file-explorer",
                "width": 800,
                "fileDropEnabled": true
            });

            window.requestUserAttention(UserAttentionType.Critical);
        });
    });
    // .then(() => console.log("listeners installed"));
