import { undoResponseSchema } from "@daruma/shared";
import { Controller, Inject, Param, ParseUUIDPipe, Post } from "@nestjs/common";
import { CurrentSession } from "../auth/auth.guard.js";
import type { AuthSession } from "../auth/auth.js";
import { SchedulingService } from "./scheduling.service.js";

@Controller("reviews")
export class ReviewsController {
  constructor(
    @Inject(SchedulingService) private readonly scheduling: SchedulingService
  ) {}

  @Post(":id/undo")
  async undo(
    @CurrentSession() { user }: AuthSession,
    @Param("id", new ParseUUIDPipe()) id: string
  ) {
    const result = await this.scheduling.undo(user.id, id);
    return undoResponseSchema.parse({ cardId: result.cardId });
  }
}
