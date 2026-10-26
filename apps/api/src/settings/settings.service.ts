import type { SettingsBody } from "@daruma/shared";
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { eq } from "drizzle-orm";
import { DB, type Db } from "../db/db.module.js";
import { userSettings } from "../db/domain-schema.js";
import { users } from "../db/schema.js";

const fields = {
  emailReminder: userSettings.emailReminder,
  inAppReminder: userSettings.inAppReminder,
  newCardsPaused: userSettings.newCardsPaused,
  newCardsPerDay: userSettings.newCardsPerDay,
  reviewTime: userSettings.reviewTime,
  theme: userSettings.theme,
  timezone: userSettings.timezone,
  timezoneAuto: userSettings.timezoneAuto,
};

@Injectable()
export class SettingsService {
  constructor(@Inject(DB) private readonly db: Db) {}

  async get(userId: string) {
    const [settings] = await this.db
      .select(fields)
      .from(userSettings)
      .where(eq(userSettings.userId, userId));
    if (!settings) {
      throw new NotFoundException("Settings not found.");
    }
    return { ...settings, reviewTime: settings.reviewTime.slice(0, 5) };
  }

  async update(userId: string, body: SettingsBody) {
    if (!Object.keys(body).length) {
      return;
    }
    await this.db
      .update(userSettings)
      .set(body)
      .where(eq(userSettings.userId, userId));
  }

  async deleteAccount(userId: string, confirmationEmail: string) {
    const [user] = await this.db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, userId));
    if (!user) {
      throw new NotFoundException("Account not found.");
    }
    if (user.email.toLowerCase() !== confirmationEmail.trim().toLowerCase()) {
      throw new BadRequestException("O e-mail não corresponde à conta.");
    }
    await this.db.delete(users).where(eq(users.id, userId));
  }
}
