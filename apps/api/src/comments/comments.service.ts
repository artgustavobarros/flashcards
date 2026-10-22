import type { Comment } from "@daruma/shared";
import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { and, asc, eq, exists, isNotNull, isNull, type SQL } from "drizzle-orm";
import { DB, type Db } from "../db/db.module.js";
import { cards, comments } from "../db/domain-schema.js";

const columns = {
  body: comments.body,
  createdAt: comments.createdAt,
  id: comments.id,
};

const toComment = (row: { body: string; createdAt: Date; id: string }) => ({
  ...row,
  createdAt: row.createdAt.toISOString(),
});

// A Card's Comments. They live and die with the Card: a deleted Card's Comments are not
// listed, edited or restored.
@Injectable()
export class CommentsService {
  constructor(@Inject(DB) private readonly db: Db) {}

  // Oldest first.
  async list(userId: string, cardId: string): Promise<Comment[]> {
    await this.liveCard(userId, cardId);
    const rows = await this.db
      .select(columns)
      .from(comments)
      .where(and(eq(comments.cardId, cardId), isNull(comments.deletedAt)))
      .orderBy(asc(comments.createdAt), asc(comments.id));
    return rows.map(toComment);
  }

  async create(userId: string, cardId: string, body: string) {
    await this.liveCard(userId, cardId);
    const [comment] = await this.db
      .insert(comments)
      .values({ body, cardId, userId })
      .returning(columns);
    // biome-ignore lint/style/noNonNullAssertion: INSERT … RETURNING yields the inserted row.
    return toComment(comment!);
  }

  async update(userId: string, commentId: string, body: string) {
    await this.set(userId, commentId, { body }, isNull(comments.deletedAt));
  }

  // Soft delete, so the toast's "Desfazer" can call restore.
  async remove(userId: string, commentId: string) {
    await this.set(
      userId,
      commentId,
      { deletedAt: new Date() },
      isNull(comments.deletedAt)
    );
  }

  async restore(userId: string, commentId: string) {
    await this.set(
      userId,
      commentId,
      { deletedAt: null },
      isNotNull(comments.deletedAt)
    );
  }

  private async set(
    userId: string,
    commentId: string,
    set: Partial<typeof comments.$inferInsert>,
    current: SQL
  ) {
    const rows = await this.db
      .update(comments)
      .set(set)
      .where(
        and(
          eq(comments.id, commentId),
          eq(comments.userId, userId),
          current,
          // Only on a Card that still exists.
          exists(
            this.db
              .select({ id: cards.id })
              .from(cards)
              .where(
                and(eq(cards.id, comments.cardId), isNull(cards.deletedAt))
              )
          )
        )
      )
      .returning({ id: comments.id });
    if (!rows.length) {
      throw new NotFoundException("Comment not found.");
    }
  }

  private async liveCard(userId: string, cardId: string) {
    const [card] = await this.db
      .select({ id: cards.id })
      .from(cards)
      .where(
        and(
          eq(cards.id, cardId),
          eq(cards.userId, userId),
          isNull(cards.deletedAt)
        )
      );
    if (!card) {
      throw new NotFoundException("Card not found.");
    }
  }
}
