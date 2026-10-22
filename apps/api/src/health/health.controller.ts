import type { Health } from "@daruma/shared";
import { Controller, Get, Inject } from "@nestjs/common";
import { sql } from "drizzle-orm";
import { DB, type Db } from "../db/db.module.js";

@Controller("health")
export class HealthController {
  constructor(@Inject(DB) private readonly db: Db) {}

  // Always 200 while the process is up; `db` says whether Postgres answered.
  @Get()
  async check(): Promise<Health> {
    try {
      await this.db.execute(sql`select 1`);
      return { db: "up", status: "ok" };
    } catch {
      return { db: "down", status: "ok" };
    }
  }
}
