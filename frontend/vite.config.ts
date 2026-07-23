/**
 * Vite configuration.
 *
 * Purpose: Configure the React plugin and proxy `/api` calls to the FastAPI
 *          backend during development so the frontend can use relative URLs.
 */
import { fileURLToPath, URL } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Match the "@/*" -> "src/*" path alias declared in tsconfig.json.
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Any request starting with /api is forwarded to the FastAPI server.
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
