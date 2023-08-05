import svgr from "vite-plugin-svgr";
import { defineConfig } from "vitest/config";

export default defineConfig({
    plugins: [svgr()],
    test: {
        globals: true,
        environment: "jsdom",
        include: ["**/*.{test,spec}.?(c|m)[jt]s?(x)"],
        coverage: {
            provider: "istanbul",
            include: ["src/components/**/*.tsx"]
        },
        alias: {
            "@src": "src",
            "@utils": "src/utils/index.ts",
            "@i18n": "src/i18n/index.ts",
            "@tauriAPI": "src/tauriAPIWrapper/index.ts",
            "@hooks": "src/hooks/index.ts",
            "@assets": "src/assets/index.ts",
            "@zustand": "src/zustand/index.ts",
            "@test-utils": "src/tests/test-utils.tsx",
            "@components": "src/components/"
        },
        clearMocks: true,
        setupFiles: "./src/tests/test-utils.tsx"
    }
});
