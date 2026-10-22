import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterAll, expect, test } from "vitest";
import { connect } from "../../test/db.js";
import { userSettings } from "../db/domain-schema.js";
import { createAuth } from "./auth.js";

const { db, pool } = connect();
afterAll(() => pool.end());

test("a new account gets its settings row with the defaults", async () => {
  const { internalAdapter } = await createAuth(db).$context;

  // The path both Google's first sign-in and the dev login take.
  const user = await internalAdapter.createUser(
    { email: `${randomUUID()}@test.local`, name: "Test" },
    { method: "dev-login" }
  );

  const [settings] = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, user.id));
  expect(settings).toMatchObject({
    newCardsPaused: false,
    newCardsPerDay: 20,
    reviewTime: "19:00:00",
    theme: "system",
    timezone: "America/Sao_Paulo",
    timezoneAuto: true,
  });
});
