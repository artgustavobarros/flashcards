import { createEnv } from "@t3-oss/env-core";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { z } from "zod";

// Read by the dev server only; nothing here reaches the browser bundle.
const env = createEnv({
  server: {
    API_ORIGIN: z.url().default("http://localhost:3001"),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});

export default defineConfig({
  server: {
    port: 3000,
    // Same origin as production, where Traefik sends /api to Nest.
    proxy: {
      "/api": env.API_ORIGIN,
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
