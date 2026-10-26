import { type SettingsBody, settingsBodySchema } from "@daruma/shared";
import { Body, Controller, HttpCode, Inject, Patch } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { CurrentSession } from "../auth/auth.guard.js";
import type { AuthSession } from "../auth/auth.js";
import { ZodPipe } from "../common/zod.pipe.js";
import { DB, type Db } from "../db/db.module.js";
import { userSettings } from "../db/domain-schema.js";

@Controller("settings")
export class SettingsController {
  constructor(@Inject(DB) private readonly db: Db) {}

  // Only the fields sent change.
  @Patch()
  @HttpCode(204)
  async update(
    @CurrentSession() { user }: AuthSession,
    @Body(new ZodPipe(settingsBodySchema)) body: SettingsBody
  ) {
    if (!Object.keys(body).length) {
      return;
    }
    await this.db
      .update(userSettings)
      .set(body)
      .where(eq(userSettings.userId, user.id));
  }
}
