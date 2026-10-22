import {
  type CommentBody,
  commentBodySchema,
  commentResponseSchema,
  commentsResponseSchema,
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
import { CommentsService } from "./comments.service.js";

const uuid = new ParseUUIDPipe();

// Listed and written under their Card, edited and deleted by their own id.
@Controller()
export class CommentsController {
  constructor(
    @Inject(CommentsService) private readonly comments: CommentsService
  ) {}

  @Get("cards/:cardId/comments")
  async list(
    @CurrentSession() { user }: AuthSession,
    @Param("cardId", uuid) cardId: string
  ) {
    return commentsResponseSchema.parse({
      comments: await this.comments.list(user.id, cardId),
    });
  }

  @Post("cards/:cardId/comments")
  async create(
    @CurrentSession() { user }: AuthSession,
    @Param("cardId", uuid) cardId: string,
    @Body(new ZodPipe(commentBodySchema)) body: CommentBody
  ) {
    return commentResponseSchema.parse({
      comment: await this.comments.create(user.id, cardId, body.body),
    });
  }

  @Patch("comments/:id")
  @HttpCode(204)
  async update(
    @CurrentSession() { user }: AuthSession,
    @Param("id", uuid) id: string,
    @Body(new ZodPipe(commentBodySchema)) body: CommentBody
  ) {
    await this.comments.update(user.id, id, body.body);
  }

  // Soft delete, so the toast's "Desfazer" can call restore.
  @Delete("comments/:id")
  @HttpCode(204)
  async remove(
    @CurrentSession() { user }: AuthSession,
    @Param("id", uuid) id: string
  ) {
    await this.comments.remove(user.id, id);
  }

  @Post("comments/:id/restore")
  @HttpCode(204)
  async restore(
    @CurrentSession() { user }: AuthSession,
    @Param("id", uuid) id: string
  ) {
    await this.comments.restore(user.id, id);
  }
}
