import { defineConfig } from "vitest/config";

// Specs that touch Postgres use their own database, created and migrated by global-setup.ts.
// The compose.yaml Postgres locally, a service container in CI.
const databaseUrl =
  process.env.TEST_DATABASE_URL ??
  "postgres://daruma:daruma@localhost:5432/daruma_test";

export default defineConfig({
  test: {
    // Set before env.ts runs, so apps/api/.env can't point the specs at the dev database.
    env: {
      BETTER_AUTH_SECRET: "test-secret-at-least-32-characters-long",
      DATABASE_URL: databaseUrl,
      NODE_ENV: "test",
    },
    globalSetup: ["./test/global-setup.ts"],
    include: ["src/**/*.spec.ts"],
  },
});
