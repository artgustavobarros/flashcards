import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 3000,
    // Same origin as production, where Traefik sends /api to Nest.
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    tanstackStart({ spa: { enabled: true } }),
    // React's plugin must come after Start's.
    viteReact(),
    tailwindcss(),
  ],
});
