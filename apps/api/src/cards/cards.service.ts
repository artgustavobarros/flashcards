import {
  type Card,
  type CardLabel,
  type CardListItem,
  type CardState,
  type CardsQuery,
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
import {
  and,
  asc,
  eq,
  exists,
  inArray,
  isNotNull,
  isNull,
  lte,
  ne,
  notInArray,
  or,
  type SQL,
  type SQLWrapper,
  sql,
} from "drizzle-orm";
import { State } from "ts-fsrs";
import { DB, type Db } from "../db/db.module.js";
import {
  cardLabels,
  cards,
  comments,
  decks,
  labels,
} from "../db/domain-schema.js";
import { cardState, MATURE_DAYS } from "../scheduling/schedule.js";
import type { Day } from "../scheduling/today.js";

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

// The search ignores accents and case on both sides (unaccent, migration 0002_search).
const fold = (value: SQLWrapper | string) => sql`lower(unaccent(${value}))`;
const contains = (text: SQLWrapper, term: SQL) =>
  sql`strpos(${fold(text)}, ${term}) > 0`;

const liveComments = and(
  eq(comments.cardId, cards.id),
  isNull(comments.deletedAt)
);

// The Card's live Labels, by name.
const labelsColumn = sql<CardLabel[]>`coalesce((
  select json_agg(json_build_object('id', ${labels.id}, 'name', ${labels.name}) order by ${labels.nameKey}, ${labels.id})
  from ${cardLabels} join ${labels} on ${labels.id} = ${cardLabels.labelId}
  where ${cardLabels.cardId} = ${cards.id} and ${labels.deletedAt} is null
), '[]'::json)`;

const summaryColumns = {
  answerText: cards.answerText,
  commentCount:
    sql<number>`(select count(*) from ${comments} where ${liveComments})`
      .mapWith(Number)
      .as("comment_count"),
  deckId: cards.deckId,
  deckName: decks.name,
  due: cards.due,
  id: cards.id,
  labels: labelsColumn.as("labels"),
  questionText: cards.questionText,
  scheduledDays: cards.scheduledDays,
  state: cards.state,
};

const withState = <T extends { scheduledDays: number; state: number }>({
  scheduledDays,
  state,
  ...row
}: T) => ({ ...row, state: cardState({ scheduledDays, state }) });

const STATE_FILTER: Record<CardState, SQL | undefined> = {
  learning: and(
    ne(cards.state, State.New),
    sql`${cards.scheduledDays} < ${MATURE_DAYS}`
  ),
  mature: and(
    ne(cards.state, State.New),
    sql`${cards.scheduledDays} >= ${MATURE_DAYS}`
  ),
  new: eq(cards.state, State.New),
};

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

// Card content, Labels and placement. The schedule columns belong to SchedulingService: nothing
// here changes them, so editing or moving a Card never resets it.
// Actions on several Cards are all or nothing: one missing Card fails the whole request.
@Injectable()
export class CardsService {
  constructor(@Inject(DB) private readonly db: Db) {}

  // Oldest first, the order they were written in. `today` is needed for due: "today".
  async list(
    userId: string,
    query: CardsQuery = {},
    today?: Day
  ): Promise<CardListItem[]> {
    const term = query.q ? fold(query.q) : undefined;
    const commentWithTerm = term
      ? and(liveComments, contains(comments.body, term))
      : undefined;
    const rows = await this.db
      .select({
        ...summaryColumns,
        // Only when neither the question nor the answer has the term.
        matchedComment: (term
          ? sql<
              string | null
            >`case when ${contains(cards.questionText, term)} or ${contains(cards.answerText, term)} then null else (
              select ${comments.body} from ${comments} where ${commentWithTerm}
              order by ${comments.createdAt}, ${comments.id} limit 1
            ) end`
          : sql<string | null>`null::text`
        ).as("matched_comment"),
      })
      .from(cards)
      .innerJoin(decks, eq(decks.id, cards.deckId))
      .where(
        and(
          this.liveCards(userId),
          query.deckId ? eq(cards.deckId, query.deckId) : undefined,
          query.labelId
            ? exists(
                this.db
                  .select({ cardId: cardLabels.cardId })
                  .from(cardLabels)
                  .where(
                    and(
                      eq(cardLabels.cardId, cards.id),
                      eq(cardLabels.labelId, query.labelId)
                    )
                  )
              )
            : undefined,
          query.state ? STATE_FILTER[query.state] : undefined,
          query.due && today
            ? and(ne(cards.state, State.New), lte(cards.due, today))
            : undefined,
          term
            ? or(
                contains(cards.questionText, term),
                contains(cards.answerText, term),
                exists(
                  this.db
                    .select({ id: comments.id })
                    .from(comments)
                    .where(commentWithTerm)
                )
              )
            : undefined
        )
      )
      .orderBy(asc(cards.createdAt), asc(cards.id));
    return rows.map(withState);
  }

  async get(userId: string, cardId: string): Promise<Card> {
    const [row] = await this.db
      .select({
        ...summaryColumns,
        answer: cards.answer,
        question: cards.question,
      })
      .from(cards)
      .innerJoin(decks, eq(decks.id, cards.deckId))
      .where(and(this.liveCards(userId), eq(cards.id, cardId)));
    if (!row) {
      throw new NotFoundException("Card not found.");
    }
    return {
      ...withState(row),
      answer: row.answer as RichText,
      question: row.question as RichText,
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
      const created = card!;
      await this.setLabels(tx, userId, created.id, body.labelIds ?? []);
      return created;
    });
  }

  update(
    userId: string,
    cardId: string,
    { labelIds, ...body }: UpdateCardBody
  ) {
    return this.db.transaction(async (tx) => {
      // updated_at is set even when only the Labels change, so the update is never empty and
      // still proves the Card is there.
      const set = {
        updatedAt: new Date(),
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
      if (labelIds) {
        await this.setLabels(tx, userId, cardId, labelIds);
      }
    });
  }

  move(userId: string, cardIds: string[], deckId: string) {
    return this.db.transaction(async (tx) => {
      await this.liveDeckId(tx, userId, deckId);
      await this.updateAll(
        tx,
        userId,
        cardIds,
        { deckId },
        isNull(cards.deletedAt)
      );
    });
  }

  // Soft delete with one timestamp, so the toast's "Desfazer" can call restore.
  async remove(userId: string, cardIds: string[]) {
    await this.updateAll(
      this.db,
      userId,
      cardIds,
      { deletedAt: new Date() },
      isNull(cards.deletedAt)
    );
  }

  // Only while their Deck still exists; a Card deleted with its Deck comes back with the Deck.
  async restore(userId: string, cardIds: string[]) {
    await this.db.transaction((tx) =>
      this.updateAll(
        tx,
        userId,
        cardIds,
        { deletedAt: null },
        and(
          isNotNull(cards.deletedAt),
          exists(
            tx
              .select({ id: decks.id })
              .from(decks)
              .where(and(eq(decks.id, cards.deckId), isNull(decks.deletedAt)))
          )
        )
      )
    );
  }

  // Puts the Label on every Card, or takes it off every Card. Cards that already are as asked
  // are left alone.
  labelAll(userId: string, cardIds: string[], labelId: string, add: boolean) {
    return this.db.transaction(async (tx) => {
      const ids = await this.liveCardIds(tx, userId, cardIds);
      await this.liveLabelIds(tx, userId, [labelId]);
      if (add) {
        await tx
          .insert(cardLabels)
          .values(ids.map((cardId) => ({ cardId, labelId, userId })))
          .onConflictDoNothing();
      } else {
        await tx
          .delete(cardLabels)
          .where(
            and(
              inArray(cardLabels.cardId, ids),
              eq(cardLabels.labelId, labelId)
            )
          );
      }
    });
  }

  // Makes the Card's live Labels exactly labelIds. Rows for deleted Labels stay, so restoring
  // such a Label puts it back here too.
  private async setLabels(
    tx: Tx,
    userId: string,
    cardId: string,
    labelIds: string[]
  ) {
    const ids = await this.liveLabelIds(tx, userId, labelIds);
    await tx.delete(cardLabels).where(
      and(
        eq(cardLabels.cardId, cardId),
        ids.length ? notInArray(cardLabels.labelId, ids) : undefined,
        exists(
          tx
            .select({ id: labels.id })
            .from(labels)
            .where(
              and(eq(labels.id, cardLabels.labelId), isNull(labels.deletedAt))
            )
        )
      )
    );
    if (ids.length) {
      await tx
        .insert(cardLabels)
        .values(ids.map((labelId) => ({ cardId, labelId, userId })))
        .onConflictDoNothing();
    }
  }

  private async updateAll(
    db: Db | Tx,
    userId: string,
    cardIds: string[],
    set: Partial<typeof cards.$inferInsert>,
    current: SQL | undefined
  ) {
    const ids = [...new Set(cardIds)];
    const rows = await db
      .update(cards)
      .set(set)
      .where(and(inArray(cards.id, ids), eq(cards.userId, userId), current))
      .returning({ id: cards.id });
    // Inside a transaction, throwing rolls back the Cards that did match.
    if (rows.length !== ids.length) {
      throw new NotFoundException("Card not found.");
    }
  }

  private liveCards(userId: string) {
    return and(eq(cards.userId, userId), isNull(cards.deletedAt));
  }

  private async liveCardIds(tx: Tx, userId: string, cardIds: string[]) {
    const ids = [...new Set(cardIds)];
    const rows = await tx
      .select({ id: cards.id })
      .from(cards)
      .where(and(this.liveCards(userId), inArray(cards.id, ids)))
      .for("share");
    if (rows.length !== ids.length) {
      throw new NotFoundException("Card not found.");
    }
    return ids;
  }

  private async liveLabelIds(tx: Tx, userId: string, labelIds: string[]) {
    const ids = [...new Set(labelIds)];
    if (!ids.length) {
      return ids;
    }
    const rows = await tx
      .select({ id: labels.id })
      .from(labels)
      .where(
        and(
          inArray(labels.id, ids),
          eq(labels.userId, userId),
          isNull(labels.deletedAt)
        )
      )
      .for("share");
    if (rows.length !== ids.length) {
      throw new NotFoundException("Label not found.");
    }
    return ids;
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
