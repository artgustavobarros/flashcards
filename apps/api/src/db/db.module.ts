import { Global, Inject, Module, type OnApplicationShutdown } from "@nestjs/common";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "../env.js";
import * as schema from "./schema.js";

export const DB = Symbol("DB");
const POOL = Symbol("POOL");

export type Db = NodePgDatabase<typeof schema>;

@Global()
@Module({
  providers: [
    { provide: POOL, useFactory: () => new Pool({ connectionString: env.DATABASE_URL }) },
    { provide: DB, inject: [POOL], useFactory: (pool: Pool): Db => drizzle({ client: pool, schema }) },
  ],
  exports: [DB],
})
export class DbModule implements OnApplicationShutdown {
  constructor(@Inject(POOL) private readonly pool: Pool) {}

  async onApplicationShutdown() {
    await this.pool.end();
  }
}
