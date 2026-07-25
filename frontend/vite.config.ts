import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  base: "/",
  build: { sourcemap: true },
  plugins: [
    TanStackRouterVite(),
    tailwindcss(),
    react(),
    visualizer({
      filename: "dist/stats.json",
      open: false,
      template: "raw-data",
    }),
  ],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8000",
      },
    },
  },
});
