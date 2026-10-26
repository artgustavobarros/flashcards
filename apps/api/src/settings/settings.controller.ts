import {
  type DeleteAccountBody,
  deleteAccountBodySchema,
  type SettingsBody,
  settingsBodySchema,
} from "@daruma/shared";
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Patch,
} from "@nestjs/common";
import { CurrentSession } from "../auth/auth.guard.js";
import type { AuthSession } from "../auth/auth.js";
import { ZodPipe } from "../common/zod.pipe.js";
import { SettingsService } from "./settings.service.js";

@Controller("settings")
export class SettingsController {
  constructor(
    @Inject(SettingsService) private readonly settings: SettingsService
  ) {}

  @Get()
  async get(@CurrentSession() { user }: AuthSession) {
    return { settings: await this.settings.get(user.id) };
  }

  // Only the fields sent change.
  @Patch()
  @HttpCode(204)
  async update(
    @CurrentSession() { user }: AuthSession,
    @Body(new ZodPipe(settingsBodySchema)) body: SettingsBody
  ) {
    await this.settings.update(user.id, body);
  }

  @Delete("account")
  @HttpCode(204)
  async deleteAccount(
    @CurrentSession() { user }: AuthSession,
    @Body(new ZodPipe(deleteAccountBodySchema)) body: DeleteAccountBody
  ) {
    await this.settings.deleteAccount(user.id, body.email);
  }
}
