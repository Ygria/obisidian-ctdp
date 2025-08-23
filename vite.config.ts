import { defineConfig, loadEnv, UserConfig } from "vite";
import path from "path";
import builtins from "builtin-modules";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
    // Load environment variables from .env files
    const env = loadEnv(mode, process.cwd(), '');
    const { resolve } = path;
    const prod = mode === "production";

    // Determine the build target. 'obsidian' for plugin, otherwise browser dev server.
    const isObsidianBuild = env.VITE_TARGET_ENV === 'obsidian';

    const sharedConfig = {
        plugins: [react()],
        resolve: {
            alias: {
                "@": path.resolve(__dirname, "./src"),
            },
        },
    };

    if (isObsidianBuild) {
        // --- CONFIGURATION FOR OBSIDIAN PLUGIN BUILD ---
        const outDir = env.VITE_PLUGIN_DIST_PATH;
        if (!outDir) {
            throw new Error("VITE_PLUGIN_DIST_PATH is not set in your .env.local file. Please define it.");
        }

        return {
            ...sharedConfig,
            build: {
                lib: {
                    entry: resolve(__dirname, "src/main.ts"),
                    name: "main",
                    fileName: () => "main.js",
                    formats: ["cjs"],
                },
                minify: prod,
                sourcemap: prod ? false : "inline",
                // Output directly to the Obsidian plugins folder
                outDir: outDir,
                cssCodeSplit: false,
                // Avoid clearing the output directory on rebuilds
                emptyOutDir: false,
                rollupOptions: {
                    // This is not needed when using lib mode's entry
                    // input: {
                    //     main: resolve(__dirname, "src/main.ts"),
                    // },
                    output: {
                        entryFileNames: "main.js",
                        assetFileNames: "styles.css",
                    },
                    external: [
                        "obsidian",
                        "electron",
                        "@codemirror/autocomplete",
                        "@codemirror/collab",
                        "@codemirror/commands",
                        "@codemirror/language",
                        "@codemirror/lint",
                        "@codemirror/search",
                        "@codemirror/state",
                        "@codemirror/view",
                        "@lezer/common",
                        "@lezer/highlight",
                        "@lezer/lr",
                        ...builtins,
                    ],
                },
                // Enable watch mode for development builds
                watch: prod ? null : {},
            },
        } as UserConfig;
    } else {
        // --- CONFIGURATION FOR BROWSER PREVIEW SERVER ---
        return {
            ...sharedConfig,
            server: {
                port: 3000,
                open: true, // Automatically open the browser
            },
        } as UserConfig;
    }
});
