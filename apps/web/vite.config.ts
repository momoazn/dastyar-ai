import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const WEB_PORT = 3001;
const SERVER_PORT = Number(process.env.SERVER_PORT) || 3000;
const SERVER_HOST = process.env.SERVER_HOST || "127.0.0.1";

console.log(`Proxying API requests to: https://${SERVER_HOST}:${SERVER_PORT}`);

export default defineConfig({
  plugins: [tailwindcss(), tanstackRouter(), react()],
  server: {
    port: Number(process.env.WEB_PORT) || WEB_PORT,
    host: "0.0.0.0", // Allow network access in dev mode
    proxy: {
      // Proxy RPC endpoints to backend server
      "/rpc": {
        target: `https://${SERVER_HOST}:${SERVER_PORT}`,
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on("error", (err, _req, _res) => {
            console.log("proxy error", err);
          });
          proxy.on("proxyReq", (_proxyReq, req, _res) => {
            console.log("Sending Request to the Target:", req.method, req.url);
          });
          proxy.on("proxyRes", (proxyRes, req, _res) => {
            console.log(
              "Received Response from the Target:",
              proxyRes.statusCode,
              req.url
            );
          });
        },
      },
      // Proxy API endpoints to backend server
      "/api": {
        target: `https://${SERVER_HOST}:${SERVER_PORT}`,
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
