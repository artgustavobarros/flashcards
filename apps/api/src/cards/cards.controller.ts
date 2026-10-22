import {
  type CreateCardBody,
  cardResponseSchema,
  cardsResponseSchema,
  createCardBodySchema,
  createCardResponseSchema,
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
const optionalUuid = new ParseUUIDPipe({ optional: true });

@Controller("cards")
export class CardsController {
  constructor(
    @Inject(CardsService) private readonly cards: CardsService,
    @Inject(SchedulingService) private readonly scheduling: SchedulingService
  ) {}

  @Get()
  async list(
    @CurrentSession() { user }: AuthSession,
    @Query("deckId", optionalUuid) deckId?: string
  ) {
    return cardsResponseSchema.parse({
      cards: await this.cards.list(user.id, { deckId }),
      today: await this.scheduling.today(user.id),
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
    await this.cards.remove(user.id, id);
  }

  @Post(":id/restore")
  @HttpCode(204)
  async restore(
    @CurrentSession() { user }: AuthSession,
    @Param("id", uuid) id: string
  ) {
    await this.cards.restore(user.id, id);
  }
}
