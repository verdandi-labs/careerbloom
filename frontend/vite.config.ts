import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

export default defineConfig({
  base: "/",
  plugins: [TanStackRouterVite(), tailwindcss(), react(), tsconfigPaths()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react") || id.includes("react-dom")) {
              return "vendor-react";
            }
            if (id.includes("zustand") || id.includes("@tanstack")) {
              return "vendor-core";
            }
            if (id.includes("lucide")) {
              return "vendor-icons";
            }
            return "vendor";
          }
          if (id.includes("/features/auth/")) {
            return "auth";
          }
          if (id.includes("/components/ui/")) {
            return "ui";
          }
        },
      },
    },
  },
});
