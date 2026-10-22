import {
  type LabelBody,
  labelBodySchema,
  labelResponseSchema,
  labelsResponseSchema,
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
import { LabelsService } from "./labels.service.js";

const labelId = new ParseUUIDPipe();

@Controller("labels")
export class LabelsController {
  constructor(@Inject(LabelsService) private readonly labels: LabelsService) {}

  @Get()
  async list(@CurrentSession() { user }: AuthSession) {
    return labelsResponseSchema.parse({
      labels: await this.labels.list(user.id),
    });
  }

  // 409 when the name is taken, ignoring accents and case.
  @Post()
  async create(
    @CurrentSession() { user }: AuthSession,
    @Body(new ZodPipe(labelBodySchema)) body: LabelBody
  ) {
    return labelResponseSchema.parse({
      label: await this.labels.create(user.id, body.name),
    });
  }

  @Patch(":id")
  @HttpCode(204)
  async rename(
    @CurrentSession() { user }: AuthSession,
    @Param("id", labelId) id: string,
    @Body(new ZodPipe(labelBodySchema)) body: LabelBody
  ) {
    await this.labels.rename(user.id, id, body.name);
  }

  // Soft delete, so the toast's "Desfazer" can call restore.
  @Delete(":id")
  @HttpCode(204)
  async remove(
    @CurrentSession() { user }: AuthSession,
    @Param("id", labelId) id: string
  ) {
    await this.labels.remove(user.id, id);
  }

  @Post(":id/restore")
  @HttpCode(204)
  async restore(
    @CurrentSession() { user }: AuthSession,
    @Param("id", labelId) id: string
  ) {
    await this.labels.restore(user.id, id);
  }
}
