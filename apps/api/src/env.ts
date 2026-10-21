import { z } from "zod";

// apps/api/.env is optional: in production the variables come from the container.
try {
  process.loadEnvFile();
} catch {}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.url(),
});

export const env = envSchema.parse(process.env);
export type Env = typeof env;
