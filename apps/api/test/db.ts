import { randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { schema } from "../src/db/db.module.js";
import { cards, decks, userSettings } from "../src/db/domain-schema.js";
import { users } from "../src/db/schema.js";
import { env } from "../src/env.js";

// Specs share the test database, so each one works inside users it creates.
export function connect() {
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  return { db: drizzle({ client: pool, schema }), pool };
}

type TestDb = ReturnType<typeof connect>["db"];

export async function createUser(db: TestDb, timezone = "America/Sao_Paulo") {
  const [user] = await db
    .insert(users)
    .values({ email: `${randomUUID()}@test.local`, name: "Test" })
    .returning({ id: users.id });
  // biome-ignore lint/style/noNonNullAssertion: INSERT … RETURNING yields the inserted row.
  const userId = user!.id;
  await db.insert(userSettings).values({ timezone, userId });
  return userId;
}

export async function createCard(db: TestDb, userId: string) {
  const [deck] = await db
    .insert(decks)
    .values({ name: "Deck", userId })
    .returning({ id: decks.id });
  const [card] = await db
    .insert(cards)
    .values({
      answer: {},
      answerText: "",
      // biome-ignore lint/style/noNonNullAssertion: INSERT … RETURNING yields the inserted row.
      deckId: deck!.id,
      question: {},
      questionText: "",
      userId,
    })
    .returning({ id: cards.id });
  // biome-ignore lint/style/noNonNullAssertion: INSERT … RETURNING yields the inserted row.
  return card!.id;
}
