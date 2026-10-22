import { ConflictException, NotFoundException } from "@nestjs/common";
import { afterAll, beforeEach, describe, expect, test } from "vitest";
import { connect, createCard, createUser } from "../../test/db.js";
import { CardsService } from "../cards/cards.service.js";
import { LabelsService } from "./labels.service.js";

const { db, pool } = connect();
afterAll(() => pool.end());

const service = new LabelsService(db);
const cardService = new CardsService(db);

let userId: string;
beforeEach(async () => {
  userId = await createUser(db);
});

describe("names", () => {
  test("listed by name, ignoring accents and case", async () => {
    await service.create(userId, "revisar");
    await service.create(userId, "Coração");
    await service.create(userId, "ossos");

    expect((await service.list(userId)).map((label) => label.name)).toEqual([
      "Coração",
      "ossos",
      "revisar",
    ]);
  });

  test("can't repeat, even with other accents, case or spacing", async () => {
    await service.create(userId, "Prova final");

    await expect(service.create(userId, "prova  FINÁL")).rejects.toThrow(
      new ConflictException("Já existe a Label “prova  FINÁL”.")
    );
  });

  test("rename refuses a name in use, but not its own in other case", async () => {
    const ossos = await service.create(userId, "ossos");
    await service.create(userId, "músculos");

    await expect(service.rename(userId, ossos.id, "Musculos")).rejects.toThrow(
      ConflictException
    );
    await service.rename(userId, ossos.id, "Ossos");
    expect((await service.list(userId)).map((label) => label.name)).toEqual([
      "músculos",
      "Ossos",
    ]);
  });

  test("another user can have the same name", async () => {
    await service.create(userId, "ossos");
    const other = await createUser(db);
    await expect(service.create(other, "ossos")).resolves.toBeDefined();
  });
});

describe("delete and restore", () => {
  test("counts only live Cards, and a deleted Label leaves the list", async () => {
    const label = await service.create(userId, "ossos");
    const live = await createCard(db, userId);
    const gone = await createCard(db, userId);
    await cardService.labelAll(userId, [live, gone], label.id, true);
    await cardService.remove(userId, [gone]);

    expect(await service.list(userId)).toEqual([{ ...label, cardCount: 1 }]);

    await service.remove(userId, label.id);
    expect(await service.list(userId)).toEqual([]);
    await expect(service.rename(userId, label.id, "x")).rejects.toThrow(
      NotFoundException
    );

    await service.restore(userId, label.id);
    expect(await service.list(userId)).toEqual([{ ...label, cardCount: 1 }]);
  });

  test("its name is free while deleted, and then restore is refused", async () => {
    const old = await service.create(userId, "ossos");
    await service.remove(userId, old.id);
    await service.create(userId, "Ossos");

    await expect(service.restore(userId, old.id)).rejects.toThrow(
      new ConflictException("Já existe uma Label com esse nome.")
    );
  });

  test("another user's Label is not found", async () => {
    const label = await service.create(userId, "ossos");
    const other = await createUser(db);
    await expect(service.remove(other, label.id)).rejects.toThrow(
      NotFoundException
    );
  });
});
