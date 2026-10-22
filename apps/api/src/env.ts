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
    DATABASE_URL: z.url(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    PORT: z.coerce.number().int().positive().default(3001),
  },
});
export type Env = typeof env;
