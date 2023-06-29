import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        globals: true,
        environment: "jsdom",
        coverage: {
            provider: "istanbul",
            include: ["src/components/**/*.tsx"]
        },
        alias: {
            src: "src/"
        },
        clearMocks: true
    }
});
