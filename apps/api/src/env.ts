import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

// apps/api/.env is optional: in production the variables come from the container.
try {
  process.loadEnvFile();
} catch {
  // No .env file: rely on the process environment.
}

export const env = createEnv({
  emptyStringAsUndefined: true,
  runtimeEnv: process.env,
  server: {
    BETTER_AUTH_SECRET: z.string().min(32),
    // Public origin of the app. The web and the API share it, so OAuth callbacks land on /api/auth.
    // Defaults to the Vite dev server only in dev and test (see authUrl below).
    BETTER_AUTH_URL: z.url().optional(),
    DATABASE_URL: z.url(),
    // Signs anyone in by e-mail, no Google. For local dev and e2e only.
    DEV_LOGIN: z.stringbool().default(false),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    // No default: a container that forgets it must not boot as "development".
    NODE_ENV: z.enum(["development", "test", "production"]),
    PORT: z.coerce.number().int().positive().default(3001),
    // Card images, one folder per user. A Docker volume in production.
    UPLOADS_DIR: z.string().default("uploads"),
  },
});

// Fail closed: the dev login, a missing Google client and the localhost URL are only allowed
// in dev and test.
const isLocal = env.NODE_ENV === "development" || env.NODE_ENV === "test";

if (!(env.BETTER_AUTH_URL || isLocal)) {
  throw new Error("BETTER_AUTH_URL is required.");
}
export const authUrl = env.BETTER_AUTH_URL ?? "http://localhost:3000";

export const googleCredentials =
  env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
    ? { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET }
    : undefined;

if (env.DEV_LOGIN && !isLocal) {
  throw new Error(
    "DEV_LOGIN is only allowed with NODE_ENV=development or test."
  );
}
if (!(googleCredentials || isLocal)) {
  throw new Error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required.");
}
