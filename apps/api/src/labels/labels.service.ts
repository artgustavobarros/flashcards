import { type Label, labelKey } from "@daruma/shared";
import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { and, asc, eq, isNotNull, isNull, type SQL, sql } from "drizzle-orm";
import { isUniqueViolation } from "../common/pg-error.js";
import { DB, type Db } from "../db/db.module.js";
import { cardLabels, cards, labels } from "../db/domain-schema.js";

const taken = (name: string) =>
  new ConflictException(`Já existe a Label “${name}”.`);

// Labels and their Card counts. Deleting a Label is a soft delete that keeps its card_labels
// rows, so restoring it puts it back on the same Cards.
@Injectable()
export class LabelsService {
  constructor(@Inject(DB) private readonly db: Db) {}

  // By name, ignoring accents and case.
  list(userId: string): Promise<Label[]> {
    return this.db
      .select({
        cardCount: sql<number>`count(${cards.id})`.mapWith(Number),
        id: labels.id,
        name: labels.name,
      })
      .from(labels)
      .leftJoin(cardLabels, eq(cardLabels.labelId, labels.id))
      .leftJoin(
        cards,
        and(eq(cards.id, cardLabels.cardId), isNull(cards.deletedAt))
      )
      .where(and(eq(labels.userId, userId), isNull(labels.deletedAt)))
      .groupBy(labels.id)
      .orderBy(asc(labels.nameKey), asc(labels.id));
  }

  async create(userId: string, name: string) {
    try {
      const [label] = await this.db
        .insert(labels)
        .values({ name, nameKey: labelKey(name), userId })
        .returning({ id: labels.id, name: labels.name });
      // biome-ignore lint/style/noNonNullAssertion: INSERT … RETURNING yields the inserted row.
      return label!;
    } catch (error) {
      throw isUniqueViolation(error) ? taken(name) : error;
    }
  }

  async rename(userId: string, labelId: string, name: string) {
    try {
      await this.update(
        userId,
        labelId,
        { name, nameKey: labelKey(name) },
        isNull(labels.deletedAt)
      );
    } catch (error) {
      throw isUniqueViolation(error) ? taken(name) : error;
    }
  }

  // Soft delete, so the toast's "Desfazer" can call restore.
  async remove(userId: string, labelId: string) {
    await this.update(
      userId,
      labelId,
      { deletedAt: new Date() },
      isNull(labels.deletedAt)
    );
  }

  // Refused if a Label with the same name was created in the meantime.
  async restore(userId: string, labelId: string) {
    try {
      await this.update(
        userId,
        labelId,
        { deletedAt: null },
        isNotNull(labels.deletedAt)
      );
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException("Já existe uma Label com esse nome.", {
          cause: error,
        });
      }
      throw error;
    }
  }

  private async update(
    userId: string,
    labelId: string,
    set: Partial<typeof labels.$inferInsert>,
    current: SQL
  ) {
    const rows = await this.db
      .update(labels)
      .set(set)
      .where(and(eq(labels.id, labelId), eq(labels.userId, userId), current))
      .returning({ id: labels.id });
    if (!rows.length) {
      throw new NotFoundException("Label not found.");
    }
  }
}
