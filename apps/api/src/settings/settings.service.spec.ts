import { settingsBodySchema } from "@daruma/shared";
import { BadRequestException } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { afterAll, beforeEach, expect, test } from "vitest";
import { connect, createUser } from "../../test/db.js";
import { userSettings } from "../db/domain-schema.js";
import { users } from "../db/schema.js";
import { SettingsService } from "./settings.service.js";

const { db, pool } = connect();
afterAll(() => pool.end());

const service = new SettingsService(db);
let userId: string;
let email: string;

beforeEach(async () => {
  userId = await createUser(db);
  const [user] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, userId));
  // biome-ignore lint/style/noNonNullAssertion: the user was just created.
  ({ email } = user!);
});

test("accepts supported partial settings and rejects invalid values", () => {
  expect(settingsBodySchema.safeParse({ newCardsPerDay: 25 }).success).toBe(
    true
  );
  expect(settingsBodySchema.safeParse({ newCardsPerDay: 23 }).success).toBe(
    false
  );
  expect(settingsBodySchema.safeParse({ reviewTime: "24:00" }).success).toBe(
    false
  );
  expect(
    settingsBodySchema.safeParse({ timezone: "Mars/Olympus" }).success
  ).toBe(false);
  expect(settingsBodySchema.safeParse({ unexpected: true }).success).toBe(
    false
  );
});

test("reads account settings with the stored defaults", async () => {
  await expect(service.get(userId)).resolves.toMatchObject({
    emailReminder: true,
    inAppReminder: true,
    newCardsPaused: false,
    newCardsPerDay: 20,
    reviewTime: "19:00",
    theme: "system",
    timezone: "America/Sao_Paulo",
    timezoneAuto: true,
  });
});

test("updates only provided settings", async () => {
  await service.update(userId, { newCardsPerDay: 35, reviewTime: "21:00" });

  await expect(service.get(userId)).resolves.toMatchObject({
    newCardsPerDay: 35,
    reviewTime: "21:00",
    theme: "system",
  });
});

test("requires the signed-in email to delete the account", async () => {
  await expect(
    service.deleteAccount(userId, "someone-else@test.local")
  ).rejects.toThrow(BadRequestException);
  await expect(
    db.select({ id: users.id }).from(users).where(eq(users.id, userId))
  ).resolves.toHaveLength(1);

  await service.deleteAccount(userId, email);
  await expect(
    db.select({ id: users.id }).from(users).where(eq(users.id, userId))
  ).resolves.toHaveLength(0);
  await expect(
    db.select().from(userSettings).where(eq(userSettings.userId, userId))
  ).resolves.toHaveLength(0);
});
