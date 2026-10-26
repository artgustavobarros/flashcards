import {
  type ProgressQuery,
  progressQuerySchema,
  progressResponseSchema,
} from "@daruma/shared";
import { Controller, Get, Inject, Query } from "@nestjs/common";
import { CurrentSession } from "../auth/auth.guard.js";
import type { AuthSession } from "../auth/auth.js";
import { ZodPipe } from "../common/zod.pipe.js";
import { ProgressService } from "./progress.service.js";

@Controller("progress")
export class ProgressController {
  constructor(
    @Inject(ProgressService) private readonly progress: ProgressService
  ) {}

  // 404 when deckId isn't one of the user's live Decks.
  @Get()
  async get(
    @CurrentSession() { user }: AuthSession,
    @Query(new ZodPipe(progressQuerySchema)) query: ProgressQuery
  ) {
    return progressResponseSchema.parse({
      progress: await this.progress.get(user.id, query),
    });
  }
}
