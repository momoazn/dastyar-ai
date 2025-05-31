import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    exclude: ["lucide"],
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
      },
      "/pb": {
        target: "http://localhost:8090",
      },
    },
  },
  build: {
    outDir: path.resolve(__dirname, "..", "backend", "dist"),
  },
});
