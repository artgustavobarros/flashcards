import {
  type DeckBody,
  deckBodySchema,
  deckResponseSchema,
  decksResponseSchema,
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
} from "@nestjs/common";
import { CurrentSession } from "../auth/auth.guard.js";
import type { AuthSession } from "../auth/auth.js";
import { ZodPipe } from "../common/zod.pipe.js";
import { SchedulingService } from "../scheduling/scheduling.service.js";
import { DecksService } from "./decks.service.js";

const deckId = new ParseUUIDPipe();

@Controller("decks")
export class DecksController {
  constructor(
    @Inject(DecksService) private readonly decks: DecksService,
    @Inject(SchedulingService) private readonly scheduling: SchedulingService
  ) {}

  @Get()
  async list(@CurrentSession() { user }: AuthSession) {
    const today = await this.scheduling.today(user.id);
    return decksResponseSchema.parse({
      decks: await this.decks.list(user.id, today),
    });
  }

  @Get(":id")
  async get(
    @CurrentSession() { user }: AuthSession,
    @Param("id", deckId) id: string
  ) {
    const today = await this.scheduling.today(user.id);
    return deckResponseSchema.parse({
      deck: await this.decks.get(user.id, id, today),
    });
  }

  @Patch(":id")
  @HttpCode(204)
  async rename(
    @CurrentSession() { user }: AuthSession,
    @Param("id", deckId) id: string,
    @Body(new ZodPipe(deckBodySchema)) body: DeckBody
  ) {
    await this.decks.rename(user.id, id, body.name);
  }

  // Soft delete, so the toast's "Desfazer" can call restore.
  @Delete(":id")
  @HttpCode(204)
  async remove(
    @CurrentSession() { user }: AuthSession,
    @Param("id", deckId) id: string
  ) {
    await this.decks.remove(user.id, id);
  }

  @Post(":id/restore")
  @HttpCode(204)
  async restore(
    @CurrentSession() { user }: AuthSession,
    @Param("id", deckId) id: string
  ) {
    await this.decks.restore(user.id, id);
  }
}
