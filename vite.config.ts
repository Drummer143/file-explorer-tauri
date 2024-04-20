import svgr from "vite-plugin-svgr";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react(), svgr({ include: "**/*.svg?react" })],

    // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
    // prevent vite from obscuring rust errors
    clearScreen: false,
    // tauri expects a fixed port, fail if that port is not available
    server: {
        port: 1420,
        strictPort: true
    },
    // to make use of `TAURI_DEBUG` and other env variables
    // https://tauri.studio/v1/api/config#buildconfig.beforedevcommand
    envPrefix: ["VITE_", "TAURI_"],
    build: {
        // rollupOptions: {
        //     input: {
        //         main: "main.html",
        //         "file-exists": "file-exists.html"
        //     }
        // },
        // Tauri supports es2021
        target: ["es2021", "chrome100", "safari13"],
        // don't minify for debug builds
        minify: !process.env.TAURI_DEBUG ? "esbuild" : false,
        // produce sourcemaps for debug builds
        sourcemap: !!process.env.TAURI_DEBUG
    },
    resolve: {
        alias: [
            { find: "@", replacement: fileURLToPath(new URL("/src", import.meta.url)) },
            { find: "@hooks", replacement: fileURLToPath(new URL("./src/hooks/index.ts", import.meta.url)) },
            { find: "@utils", replacement: fileURLToPath(new URL("./src/utils/index.ts", import.meta.url)) },
            { find: "@i18n", replacement: fileURLToPath(new URL("./src/i18n/index.ts", import.meta.url)) },
            { find: "@assets", replacement: fileURLToPath(new URL("./src/assets/index.ts", import.meta.url)) },
            {
                find: "@tauriAPI",
                replacement: fileURLToPath(new URL("./src/tauriAPIWrapper/index.ts", import.meta.url))
            },
            { find: "@zustand", replacement: fileURLToPath(new URL("./src/zustand/index.ts", import.meta.url)) },
            { find: "@components", replacement: fileURLToPath(new URL("./src/components/index.ts", import.meta.url)) },
            { find: "@contexts", replacement: fileURLToPath(new URL("./src/contexts/index.ts", import.meta.url)) }
        ]
    }
});
