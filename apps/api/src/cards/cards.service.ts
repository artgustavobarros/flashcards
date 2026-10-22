import {
  type Card,
  type CardListItem,
  type CreateCardBody,
  hasContent,
  type RichText,
  toPlainText,
  type UpdateCardBody,
} from "@daruma/shared";
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { and, asc, eq, isNotNull, isNull, type SQL } from "drizzle-orm";
import { DB, type Db } from "../db/db.module.js";
import { cards, decks } from "../db/domain-schema.js";
import { cardState } from "../scheduling/schedule.js";

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

const listColumns = {
  answerText: cards.answerText,
  deckId: cards.deckId,
  deckName: decks.name,
  due: cards.due,
  id: cards.id,
  questionText: cards.questionText,
  scheduledDays: cards.scheduledDays,
  state: cards.state,
};

const toListItem = ({
  scheduledDays,
  state,
  ...row
}: {
  scheduledDays: number;
  state: number;
} & Omit<CardListItem, "state">): CardListItem => ({
  ...row,
  state: cardState({ scheduledDays, state }),
});

// The JSON and its plain text are always written together.
function written(doc: RichText, missing: string) {
  if (!hasContent(doc)) {
    throw new BadRequestException(missing);
  }
  return { doc, text: toPlainText(doc) };
}
const questionColumns = (doc: RichText) => {
  const { doc: question, text } = written(doc, "Escreva a pergunta.");
  return { question, questionText: text };
};
const answerColumns = (doc: RichText) => {
  const { doc: answer, text } = written(doc, "Escreva a resposta.");
  return { answer, answerText: text };
};

// Card content and placement. The schedule columns belong to SchedulingService: nothing here
// changes them, so editing or moving a Card never resets it.
@Injectable()
export class CardsService {
  constructor(@Inject(DB) private readonly db: Db) {}

  // Oldest first, the order they were written in.
  async list(userId: string, filter: { deckId?: string } = {}) {
    const rows = await this.db
      .select(listColumns)
      .from(cards)
      .innerJoin(decks, eq(decks.id, cards.deckId))
      .where(
        and(
          this.liveCards(userId),
          filter.deckId ? eq(cards.deckId, filter.deckId) : undefined
        )
      )
      .orderBy(asc(cards.createdAt), asc(cards.id));
    return rows.map(toListItem);
  }

  async get(userId: string, cardId: string): Promise<Card> {
    const [row] = await this.db
      .select({
        ...listColumns,
        answer: cards.answer,
        question: cards.question,
      })
      .from(cards)
      .innerJoin(decks, eq(decks.id, cards.deckId))
      .where(and(this.liveCards(userId), eq(cards.id, cardId)));
    if (!row) {
      throw new NotFoundException("Card not found.");
    }
    const { answer, question, ...item } = row;
    return {
      ...toListItem(item),
      answer: answer as RichText,
      question: question as RichText,
    };
  }

  create(userId: string, body: CreateCardBody) {
    return this.db.transaction(async (tx) => {
      const deckId =
        "deckId" in body
          ? await this.liveDeckId(tx, userId, body.deckId)
          : await this.insertDeck(tx, userId, body.deckName);
      const [card] = await tx
        .insert(cards)
        .values({
          ...questionColumns(body.question),
          ...answerColumns(body.answer),
          deckId,
          userId,
        })
        .returning({ deckId: cards.deckId, id: cards.id });
      // biome-ignore lint/style/noNonNullAssertion: INSERT … RETURNING yields the inserted row.
      return card!;
    });
  }

  update(userId: string, cardId: string, body: UpdateCardBody) {
    return this.db.transaction(async (tx) => {
      const set = {
        ...(body.question && questionColumns(body.question)),
        ...(body.answer && answerColumns(body.answer)),
        ...(body.deckId && {
          deckId: await this.liveDeckId(tx, userId, body.deckId),
        }),
      };
      const rows = await tx
        .update(cards)
        .set(set)
        .where(and(this.liveCards(userId), eq(cards.id, cardId)))
        .returning({ id: cards.id });
      if (!rows.length) {
        throw new NotFoundException("Card not found.");
      }
    });
  }

  // Soft delete, so the toast's "Desfazer" can call restore.
  async remove(userId: string, cardId: string) {
    await this.setDeleted(userId, cardId, new Date(), isNull(cards.deletedAt));
  }

  // Only while its Deck still exists; a Card deleted with its Deck comes back with the Deck.
  restore(userId: string, cardId: string) {
    return this.db.transaction(async (tx) => {
      const [card] = await tx
        .select({ deckId: cards.deckId })
        .from(cards)
        .where(and(eq(cards.id, cardId), eq(cards.userId, userId)));
      if (card) {
        await this.liveDeckId(tx, userId, card.deckId);
      }
      await this.setDeleted(
        userId,
        cardId,
        null,
        isNotNull(cards.deletedAt),
        tx
      );
    });
  }

  private async setDeleted(
    userId: string,
    cardId: string,
    deletedAt: Date | null,
    current: SQL,
    db: Db | Tx = this.db
  ) {
    const rows = await db
      .update(cards)
      .set({ deletedAt })
      .where(and(eq(cards.id, cardId), eq(cards.userId, userId), current))
      .returning({ id: cards.id });
    if (!rows.length) {
      throw new NotFoundException("Card not found.");
    }
  }

  private liveCards(userId: string) {
    return and(eq(cards.userId, userId), isNull(cards.deletedAt));
  }

  private async liveDeckId(tx: Tx, userId: string, deckId: string) {
    const [deck] = await tx
      .select({ id: decks.id })
      .from(decks)
      .where(
        and(
          eq(decks.id, deckId),
          eq(decks.userId, userId),
          isNull(decks.deletedAt)
        )
      )
      .for("share");
    if (!deck) {
      throw new NotFoundException("Deck not found.");
    }
    return deck.id;
  }

  private async insertDeck(tx: Tx, userId: string, name: string) {
    const [deck] = await tx
      .insert(decks)
      .values({ name, userId })
      .returning({ id: decks.id });
    // biome-ignore lint/style/noNonNullAssertion: INSERT … RETURNING yields the inserted row.
    return deck!.id;
  }
}
