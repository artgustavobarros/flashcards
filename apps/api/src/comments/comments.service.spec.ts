import { NotFoundException } from "@nestjs/common";
import { afterAll, beforeEach, expect, test } from "vitest";
import { connect, createCard, createUser } from "../../test/db.js";
import { CardsService } from "../cards/cards.service.js";
import { CommentsService } from "./comments.service.js";

const { db, pool } = connect();
afterAll(() => pool.end());

const service = new CommentsService(db);

let userId: string;
let cardId: string;
beforeEach(async () => {
  userId = await createUser(db);
  cardId = await createCard(db, userId);
});

const bodies = async () =>
  (await service.list(userId, cardId)).map((comment) => comment.body);

test("listed oldest first, edited in place", async () => {
  const first = await service.create(userId, cardId, "Caiu na prova.");
  await service.create(userId, cardId, "Mitral = bicúspide.");

  await service.update(userId, first.id, "Caiu na prova do módulo 2.");

  expect(await bodies()).toEqual([
    "Caiu na prova do módulo 2.",
    "Mitral = bicúspide.",
  ]);
});

test("a deleted Comment leaves the list and comes back", async () => {
  const comment = await service.create(userId, cardId, "nota");

  await service.remove(userId, comment.id);
  expect(await bodies()).toEqual([]);
  await expect(service.update(userId, comment.id, "x")).rejects.toThrow(
    NotFoundException
  );

  await service.restore(userId, comment.id);
  expect(await bodies()).toEqual(["nota"]);
});

test("a deleted Card's Comments can't be read, written or restored", async () => {
  const comment = await service.create(userId, cardId, "nota");
  await service.remove(userId, comment.id);
  await new CardsService(db).remove(userId, [cardId]);

  await expect(service.list(userId, cardId)).rejects.toThrow(NotFoundException);
  await expect(service.create(userId, cardId, "x")).rejects.toThrow(
    NotFoundException
  );
  await expect(service.restore(userId, comment.id)).rejects.toThrow(
    NotFoundException
  );
});

test("another user's Card and Comments are not found", async () => {
  const comment = await service.create(userId, cardId, "nota");
  const other = await createUser(db);

  await expect(service.list(other, cardId)).rejects.toThrow(NotFoundException);
  await expect(service.remove(other, comment.id)).rejects.toThrow(
    NotFoundException
  );
});
