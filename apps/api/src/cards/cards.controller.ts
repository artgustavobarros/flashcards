import {
  type CardIdsBody,
  type CardsLabelBody,
  type CardsQuery,
  type CreateCardBody,
  cardIdsBodySchema,
  cardResponseSchema,
  cardsLabelBodySchema,
  cardsQuerySchema,
  cardsResponseSchema,
  createCardBodySchema,
  createCardResponseSchema,
  type MoveCardsBody,
  moveCardsBodySchema,
  type UpdateCardBody,
  updateCardBodySchema,
} from "@daruma/shared";
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { CurrentSession } from "../auth/auth.guard.js";
import type { AuthSession } from "../auth/auth.js";
import { ZodPipe } from "../common/zod.pipe.js";
import { SchedulingService } from "../scheduling/scheduling.service.js";
import { CardsService } from "./cards.service.js";

const uuid = new ParseUUIDPipe();

@Controller("cards")
export class CardsController {
  constructor(
    @Inject(CardsService) private readonly cards: CardsService,
    @Inject(SchedulingService) private readonly scheduling: SchedulingService
  ) {}

  // Filters and search: see cardsQuerySchema.
  @Get()
  async list(
    @CurrentSession() { user }: AuthSession,
    @Query(new ZodPipe(cardsQuerySchema)) query: CardsQuery
  ) {
    const today = await this.scheduling.today(user.id);
    return cardsResponseSchema.parse({
      cards: await this.cards.list(user.id, query, today),
      today,
    });
  }

  @Get(":id")
  async get(
    @CurrentSession() { user }: AuthSession,
    @Param("id", uuid) id: string
  ) {
    return cardResponseSchema.parse({
      card: await this.cards.get(user.id, id),
      today: await this.scheduling.today(user.id),
    });
  }

  @Post()
  async create(
    @CurrentSession() { user }: AuthSession,
    @Body(new ZodPipe(createCardBodySchema)) body: CreateCardBody
  ) {
    return createCardResponseSchema.parse({
      card: await this.cards.create(user.id, body),
    });
  }

  @Patch(":id")
  @HttpCode(204)
  async update(
    @CurrentSession() { user }: AuthSession,
    @Param("id", uuid) id: string,
    @Body(new ZodPipe(updateCardBodySchema)) body: UpdateCardBody
  ) {
    await this.cards.update(user.id, id, body);
  }

  @Delete(":id")
  @HttpCode(204)
  async remove(
    @CurrentSession() { user }: AuthSession,
    @Param("id", uuid) id: string
  ) {
    await this.cards.remove(user.id, [id]);
  }

  @Post(":id/restore")
  @HttpCode(204)
  async restore(
    @CurrentSession() { user }: AuthSession,
    @Param("id", uuid) id: string
  ) {
    await this.cards.restore(user.id, [id]);
  }

  // Selection actions. All or nothing: 404 if any Card is missing.
  @Post("move")
  @HttpCode(204)
  async move(
    @CurrentSession() { user }: AuthSession,
    @Body(new ZodPipe(moveCardsBodySchema)) body: MoveCardsBody
  ) {
    await this.cards.move(user.id, body.cardIds, body.deckId);
  }

  @Post("label")
  @HttpCode(204)
  async label(
    @CurrentSession() { user }: AuthSession,
    @Body(new ZodPipe(cardsLabelBodySchema)) body: CardsLabelBody
  ) {
    await this.cards.labelAll(user.id, body.cardIds, body.labelId, body.add);
  }

  @Post("delete")
  @HttpCode(204)
  async removeAll(
    @CurrentSession() { user }: AuthSession,
    @Body(new ZodPipe(cardIdsBodySchema)) body: CardIdsBody
  ) {
    await this.cards.remove(user.id, body.cardIds);
  }

  @Post("restore")
  @HttpCode(204)
  async restoreAll(
    @CurrentSession() { user }: AuthSession,
    @Body(new ZodPipe(cardIdsBodySchema)) body: CardIdsBody
  ) {
    await this.cards.restore(user.id, body.cardIds);
  }
}
