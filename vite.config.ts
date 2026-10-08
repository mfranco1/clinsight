import { transformBrandHtml } from "./src/config/brandHtml";
import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const isTestBuild = mode === "test";
  const env = isTestBuild ? {} : loadEnv(mode, ".", "");
  return {
    server: {
      port: 3000,
      host: "0.0.0.0",
    },
    plugins: [
      react(),
      tailwindcss(),
      {
        name: "clinsight-brand",
        transformIndexHtml: {
          order: "pre",
          handler: (html) => transformBrandHtml(html),
        },
      },
    ],
    define: {
      __CLINSIGHT_TEST_MODE__: JSON.stringify(isTestBuild),
      "process.env.API_KEY": JSON.stringify(
        isTestBuild ? "test-disabled" : env.GEMINI_API_KEY,
      ),
      "process.env.GEMINI_API_KEY": JSON.stringify(
        isTestBuild ? "test-disabled" : env.GEMINI_API_KEY,
      ),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("/node_modules/katex/")) {
              return "katex-vendor";
            }
            if (
              id.includes("/node_modules/@tiptap/markdown/") ||
              id.includes("/node_modules/marked/")
            ) {
              return "tiptap-markdown";
            }
            if (
              id.includes("/node_modules/@tiptap/") ||
              id.includes("/node_modules/prosemirror-")
            ) {
              return "tiptap-vendor";
            }
            if (id.includes("/node_modules/@lezer/")) {
              return "codemirror-parser";
            }
            if (id.includes("/node_modules/@codemirror/")) {
              return "codemirror-vendor";
            }
            if (
              id.includes("/node_modules/react/") ||
              id.includes("/node_modules/react-dom/") ||
              id.includes("/node_modules/scheduler/")
            ) {
              return "react-vendor";
            }
          },
        },
      },
    },
  };
});
