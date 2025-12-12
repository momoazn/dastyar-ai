import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const WEB_PORT = 3001;
const SERVER_PORT = Number(process.env.SERVER_PORT) || 3000;
const SERVER_HOST = process.env.SERVER_HOST || "127.0.0.1";
const SERVER_PROTOCOL = process.env.SERVER_PROTOCOL || "http";

export default defineConfig({
  plugins: [tailwindcss(), tanstackRouter(), react()],
  server: {
    port: Number(process.env.WEB_PORT) || WEB_PORT,
    host: "0.0.0.0", // Allow network access in dev mode
    proxy: {
      // Proxy RPC endpoints to backend server
      "/rpc": {
        target: `${SERVER_PROTOCOL}://${SERVER_HOST}:${SERVER_PORT}`,
        changeOrigin: true,
        secure: false,
        configure: (_proxy, _options) => {
          // Proxy configuration - errors are handled by Vite's error handling
          // Detailed logging can be enabled via VITE_LOG_LEVEL=debug if needed
        },
      },
      // Proxy API endpoints to backend server
      "/api": {
        target: `${SERVER_PROTOCOL}://${SERVER_HOST}:${SERVER_PORT}`,
        changeOrigin: true,
        secure: false,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@/server": path.resolve(__dirname, "../server/src"),
    },
  },
  build: {
    outDir: "./dist",
    emptyOutDir: true,
  },
});
