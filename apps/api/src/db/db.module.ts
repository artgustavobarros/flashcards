import {
  Global,
  Inject,
  Module,
  type OnApplicationShutdown,
} from "@nestjs/common";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "../env.js";
// biome-ignore lint/performance/noNamespaceImport: Drizzle takes the whole schema module.
import * as domainSchema from "./domain-schema.js";
// biome-ignore lint/performance/noNamespaceImport: Drizzle takes the whole schema module.
import * as authSchema from "./schema.js";

export const DB = Symbol("DB");
const POOL = Symbol("POOL");

export const schema = { ...authSchema, ...domainSchema };

export type Db = NodePgDatabase<typeof schema>;

@Global()
@Module({
  exports: [DB],
  providers: [
    {
      provide: POOL,
      useFactory: () => new Pool({ connectionString: env.DATABASE_URL }),
    },
    {
      inject: [POOL],
      provide: DB,
      useFactory: (pool: Pool): Db => drizzle({ client: pool, schema }),
    },
  ],
})
export class DbModule implements OnApplicationShutdown {
  constructor(@Inject(POOL) private readonly pool: Pool) {}

  async onApplicationShutdown() {
    await this.pool.end();
  }
}
