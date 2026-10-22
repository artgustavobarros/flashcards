import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Client } from "pg";
import type { TestProject } from "vitest/node";

// Creates the test database if it doesn't exist and applies every migration to it.
export default async function setup(project: TestProject) {
  const url = new URL(project.config.env.DATABASE_URL as string);
  const name = url.pathname.slice(1);

  const admin = new Client({
    connectionString: Object.assign(new URL(url), { pathname: "/postgres" })
      .href,
  });
  await admin.connect();
  const { rowCount } = await admin.query(
    "SELECT 1 FROM pg_database WHERE datname = $1",
    [name]
  );
  if (!rowCount) {
    await admin.query(`CREATE DATABASE "${name}"`);
  }
  await admin.end();

  const client = new Client({ connectionString: url.href });
  await client.connect();
  await migrate(drizzle({ client }), { migrationsFolder: "./drizzle" });
  await client.end();
}
