// Domain tables. Auth tables live in schema.ts, which the Better Auth CLI owns.
// Every table is per user and cascades from users, so deleting the account is one DELETE.
// Decks, Cards, Labels and Comments are soft-deleted (deleted_at) so a toast can undo it.
import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  doublePrecision,
  foreignKey,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  time,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./schema.js";

const id = () => uuid("id").default(sql`pg_catalog.gen_random_uuid()`);
const userId = () =>
  uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" });
const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).defaultNow().notNull();
const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull();
const deletedAt = () => timestamp("deleted_at", { withTimezone: true });
// A day on the user's own calendar, as 'YYYY-MM-DD'. See scheduling/today.ts.
const localDay = (name: string) => date(name, { mode: "string" });

export const decks = pgTable(
  "decks",
  {
    createdAt: createdAt(),
    deletedAt: deletedAt(),
    id: id().primaryKey(),
    name: text("name").notNull(),
    updatedAt: updatedAt(),
    userId: userId(),
  },
  (table) => [
    index("decks_user_id_idx").on(table.userId),
    // Target of cards' (deck_id, user_id) foreign key: a Card can't sit in someone else's Deck.
    unique("decks_id_user_id_key").on(table.id, table.userId),
  ]
);

// The FSRS schedule is stored as columns on the Card (see scheduling/schedule.ts).
// state is ts-fsrs's State: 0 New, 1 Learning, 2 Review, 3 Relearning. A New Card has no due day.
export const cards = pgTable(
  "cards",
  {
    // Tiptap JSON, plus its plain text for search and list previews.
    answer: jsonb("answer").notNull(),
    answerText: text("answer_text").notNull(),
    createdAt: createdAt(),
    deckId: uuid("deck_id").notNull(),
    deletedAt: deletedAt(),
    difficulty: doublePrecision("difficulty").default(0).notNull(),
    due: localDay("due"),
    id: id().primaryKey(),
    lapses: integer("lapses").default(0).notNull(),
    lastReviewedOn: localDay("last_reviewed_on"),
    // Orders the New Card queue. A Schedule Reset moves the Card to the end by setting it to now().
    newQueuedAt: timestamp("new_queued_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    question: jsonb("question").notNull(),
    questionText: text("question_text").notNull(),
    reps: integer("reps").default(0).notNull(),
    scheduledDays: integer("scheduled_days").default(0).notNull(),
    stability: doublePrecision("stability").default(0).notNull(),
    state: smallint("state").default(0).notNull(),
    updatedAt: updatedAt(),
    userId: userId(),
  },
  (table) => [
    foreignKey({
      columns: [table.deckId, table.userId],
      foreignColumns: [decks.id, decks.userId],
      name: "cards_deck_id_user_id_fkey",
    }).onDelete("cascade"),
    unique("cards_id_user_id_key").on(table.id, table.userId),
    index("cards_deck_id_idx").on(table.deckId),
    index("cards_user_id_due_idx").on(table.userId, table.due),
    index("cards_user_id_new_queued_at_idx")
      .on(table.userId, table.newQueuedAt)
      .where(sql`${table.state} = 0`),
    check("cards_state_check", sql`${table.state} between 0 and 3`),
    check(
      "cards_due_check",
      sql`(${table.state} = 0) = (${table.due} is null)`
    ),
  ]
);

export const labels = pgTable(
  "labels",
  {
    createdAt: createdAt(),
    deletedAt: deletedAt(),
    id: id().primaryKey(),
    name: text("name").notNull(),
    // The name lowercased and without accents, so "Músculo" and "musculo" can't both exist.
    nameKey: text("name_key").notNull(),
    updatedAt: updatedAt(),
    userId: userId(),
  },
  (table) => [
    unique("labels_id_user_id_key").on(table.id, table.userId),
    uniqueIndex("labels_user_id_name_key_key")
      .on(table.userId, table.nameKey)
      .where(sql`${table.deletedAt} is null`),
  ]
);

export const cardLabels = pgTable(
  "card_labels",
  {
    cardId: uuid("card_id").notNull(),
    createdAt: createdAt(),
    labelId: uuid("label_id").notNull(),
    userId: userId(),
  },
  (table) => [
    primaryKey({
      columns: [table.cardId, table.labelId],
      name: "card_labels_pkey",
    }),
    // Both keys carry user_id: a Label can't be put on someone else's Card.
    foreignKey({
      columns: [table.cardId, table.userId],
      foreignColumns: [cards.id, cards.userId],
      name: "card_labels_card_id_user_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.labelId, table.userId],
      foreignColumns: [labels.id, labels.userId],
      name: "card_labels_label_id_user_id_fkey",
    }).onDelete("cascade"),
    index("card_labels_label_id_idx").on(table.labelId),
  ]
);

export const comments = pgTable(
  "comments",
  {
    body: text("body").notNull(),
    cardId: uuid("card_id").notNull(),
    createdAt: createdAt(),
    deletedAt: deletedAt(),
    id: id().primaryKey(),
    updatedAt: updatedAt(),
    userId: userId(),
  },
  (table) => [
    foreignKey({
      columns: [table.cardId, table.userId],
      foreignColumns: [cards.id, cards.userId],
      name: "comments_card_id_user_id_fkey",
    }).onDelete("cascade"),
    index("comments_card_id_created_at_idx").on(table.cardId, table.createdAt),
  ]
);

export const reviewKind = pgEnum("review_kind", ["rating", "reset"]);

// Append-only log of Ratings and Schedule Resets. Each row keeps a copy of the Card's schedule
// from before it (prev_*): Undo writes the copy back and deletes the row. Metrics read only
// kind = 'rating' and affects_schedule rows.
export const reviews = pgTable(
  "reviews",
  {
    // false for a repeat Rating after Errei on the same day: it skips FSRS and the metrics.
    affectsSchedule: boolean("affects_schedule").default(true).notNull(),
    cardId: uuid("card_id").notNull(),
    durationMs: integer("duration_ms"),
    id: id().primaryKey(),
    kind: reviewKind("kind").notNull(),
    prevDifficulty: doublePrecision("prev_difficulty").notNull(),
    prevDue: localDay("prev_due"),
    prevLapses: integer("prev_lapses").notNull(),
    prevLastReviewedOn: localDay("prev_last_reviewed_on"),
    prevReps: integer("prev_reps").notNull(),
    prevScheduledDays: integer("prev_scheduled_days").notNull(),
    prevStability: doublePrecision("prev_stability").notNull(),
    prevState: smallint("prev_state").notNull(),
    // 1 Errei, 2 Difícil, 3 Bom, 4 Fácil. Null on a reset.
    rating: smallint("rating"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    reviewedOn: localDay("reviewed_on").notNull(),
    userId: userId(),
  },
  (table) => [
    foreignKey({
      columns: [table.cardId, table.userId],
      foreignColumns: [cards.id, cards.userId],
      name: "reviews_card_id_user_id_fkey",
    }).onDelete("cascade"),
    index("reviews_user_id_reviewed_at_idx").on(table.userId, table.reviewedAt),
    index("reviews_card_id_reviewed_at_idx").on(table.cardId, table.reviewedAt),
    check(
      "reviews_rating_check",
      sql`case ${table.kind} when 'rating' then ${table.rating} between 1 and 4 else ${table.rating} is null end`
    ),
  ]
);

export const theme = pgEnum("theme", ["light", "dark", "system"]);

// One row per user, created at the first sign-in (auth.ts).
export const userSettings = pgTable(
  "user_settings",
  {
    createdAt: createdAt(),
    emailReminder: boolean("email_reminder").default(true).notNull(),
    inAppReminder: boolean("in_app_reminder").default(true).notNull(),
    newCardsPaused: boolean("new_cards_paused").default(false).notNull(),
    newCardsPerDay: smallint("new_cards_per_day").default(20).notNull(),
    reviewTime: time("review_time").default("19:00").notNull(),
    theme: theme("theme").default("system").notNull(),
    // IANA name. With timezone_auto on, the web keeps it in sync with the device.
    timezone: text("timezone").default("America/Sao_Paulo").notNull(),
    timezoneAuto: boolean("timezone_auto").default(true).notNull(),
    updatedAt: updatedAt(),
    userId: uuid("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => [
    check(
      "user_settings_new_cards_per_day_check",
      sql`${table.newCardsPerDay} between 0 and 200`
    ),
  ]
);

// One row per user per local day, written when something happens that day (Daily Review done,
// marked as seen, bell opened, e-mail sent). Today's New Cards and Daily Review are never stored.
export const userDays = pgTable(
  "user_days",
  {
    bellOpenedAt: timestamp("bell_opened_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    day: localDay("day").notNull(),
    emailSentAt: timestamp("email_sent_at", { withTimezone: true }),
    seenAt: timestamp("seen_at", { withTimezone: true }),
    userId: userId(),
  },
  (table) => [
    primaryKey({
      columns: [table.userId, table.day],
      name: "user_days_pkey",
    }),
  ]
);

export const decksRelations = relations(decks, ({ many }) => ({
  cards: many(cards),
}));

export const cardsRelations = relations(cards, ({ many, one }) => ({
  cardLabels: many(cardLabels),
  comments: many(comments),
  deck: one(decks, { fields: [cards.deckId], references: [decks.id] }),
  reviews: many(reviews),
}));

export const labelsRelations = relations(labels, ({ many }) => ({
  cardLabels: many(cardLabels),
}));

export const cardLabelsRelations = relations(cardLabels, ({ one }) => ({
  card: one(cards, { fields: [cardLabels.cardId], references: [cards.id] }),
  label: one(labels, { fields: [cardLabels.labelId], references: [labels.id] }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  card: one(cards, { fields: [comments.cardId], references: [cards.id] }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  card: one(cards, { fields: [reviews.cardId], references: [cards.id] }),
}));
