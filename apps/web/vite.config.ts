import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const WEB_PORT = 3001;

export default defineConfig({
  plugins: [tailwindcss(), tanstackRouter(), react()],
  server: {
    port: Number(process.env.WEB_PORT) || WEB_PORT,
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
