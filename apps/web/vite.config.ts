import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

type AppConfig = {
  HOST?: string;
  PORT?: number;
  WEB_DEV_PORT?: number;
};

const loadAppConfig = (): AppConfig => {
  const configPath = path.resolve(__dirname, "../../config.json");
  if (!existsSync(configPath)) {
    return {};
  }

  return JSON.parse(readFileSync(configPath, "utf8")) as AppConfig;
};

const appConfig = loadAppConfig();
const webPort = appConfig.WEB_DEV_PORT ?? 3001;
const serverPort = appConfig.PORT ?? 3000;
const serverHost =
  !appConfig.HOST || appConfig.HOST === "0.0.0.0"
    ? "127.0.0.1"
    : appConfig.HOST;
const serverTarget = `http://${serverHost}:${serverPort}`;

export default defineConfig({
  plugins: [tailwindcss(), tanstackRouter(), react()],
  server: {
    port: webPort,
    host: "0.0.0.0",
    proxy: {
      "/rpc": {
        target: serverTarget,
        changeOrigin: true,
        secure: false,
      },
      "/api": {
        target: serverTarget,
        changeOrigin: true,
        secure: false,
      },
      "/health": {
        target: serverTarget,
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
