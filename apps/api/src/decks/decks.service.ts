import type { Deck } from "@daruma/shared";
import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { and, asc, eq, isNull, sql } from "drizzle-orm";
import { State } from "ts-fsrs";
import { DB, type Db } from "../db/db.module.js";
import { cards, decks } from "../db/domain-schema.js";
import type { Day } from "../scheduling/today.js";

// Decks with their counts. Deleting a Deck soft-deletes its Cards with the same timestamp, so
// restoring it brings back exactly those Cards and not ones deleted earlier on their own.
@Injectable()
export class DecksService {
  constructor(@Inject(DB) private readonly db: Db) {}

  list(userId: string, today: Day): Promise<Deck[]> {
    return this.summaries(userId, today);
  }

  async get(userId: string, deckId: string, today: Day): Promise<Deck> {
    const [deck] = await this.summaries(userId, today, deckId);
    if (!deck) {
      throw new NotFoundException("Deck not found.");
    }
    return deck;
  }

  async rename(userId: string, deckId: string, name: string) {
    const rows = await this.db
      .update(decks)
      .set({ name })
      .where(this.liveDeck(userId, deckId))
      .returning({ id: decks.id });
    if (!rows.length) {
      throw new NotFoundException("Deck not found.");
    }
  }

  remove(userId: string, deckId: string) {
    return this.db.transaction(async (tx) => {
      const deletedAt = new Date();
      const rows = await tx
        .update(decks)
        .set({ deletedAt })
        .where(this.liveDeck(userId, deckId))
        .returning({ id: decks.id });
      if (!rows.length) {
        throw new NotFoundException("Deck not found.");
      }
      await tx
        .update(cards)
        .set({ deletedAt })
        .where(and(eq(cards.deckId, deckId), isNull(cards.deletedAt)));
    });
  }

  restore(userId: string, deckId: string) {
    return this.db.transaction(async (tx) => {
      const [deck] = await tx
        .select({ deletedAt: decks.deletedAt })
        .from(decks)
        .where(and(eq(decks.id, deckId), eq(decks.userId, userId)))
        .for("update");
      if (!deck?.deletedAt) {
        throw new NotFoundException("Deck not found.");
      }
      await tx
        .update(cards)
        .set({ deletedAt: null })
        .where(
          and(eq(cards.deckId, deckId), eq(cards.deletedAt, deck.deletedAt))
        );
      await tx
        .update(decks)
        .set({ deletedAt: null })
        .where(eq(decks.id, deckId));
    });
  }

  // Oldest first, the order they were created in.
  private summaries(userId: string, today: Day, deckId?: string) {
    return this.db
      .select({
        cardCount: sql<number>`count(${cards.id})`.mapWith(Number),
        dueCount:
          sql<number>`count(${cards.id}) filter (where ${cards.state} <> ${State.New} and ${cards.due} <= ${today})`.mapWith(
            Number
          ),
        id: decks.id,
        name: decks.name,
        newCount:
          sql<number>`count(${cards.id}) filter (where ${cards.state} = ${State.New})`.mapWith(
            Number
          ),
      })
      .from(decks)
      .leftJoin(cards, and(eq(cards.deckId, decks.id), isNull(cards.deletedAt)))
      .where(
        and(
          eq(decks.userId, userId),
          isNull(decks.deletedAt),
          deckId ? eq(decks.id, deckId) : undefined
        )
      )
      .groupBy(decks.id)
      .orderBy(asc(decks.createdAt), asc(decks.id));
  }

  private liveDeck(userId: string, deckId: string) {
    return and(
      eq(decks.id, deckId),
      eq(decks.userId, userId),
      isNull(decks.deletedAt)
    );
  }
}
