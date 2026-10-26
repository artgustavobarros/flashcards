import { todayResponseSchema } from "@daruma/shared";
import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Post,
} from "@nestjs/common";
import { CurrentSession } from "../auth/auth.guard.js";
import type { AuthSession } from "../auth/auth.js";
import { TodayService } from "./today.service.js";

@Controller("today")
export class TodayController {
  constructor(@Inject(TodayService) private readonly today: TodayService) {}

  @Get()
  async get(@CurrentSession() { user }: AuthSession) {
    return todayResponseSchema.parse({ today: await this.today.get(user.id) });
  }

  @Post("seen")
  @HttpCode(204)
  async markSeen(@CurrentSession() { user }: AuthSession) {
    await this.today.markSeen(user.id, true);
  }

  // The toast's "Desfazer".
  @Delete("seen")
  @HttpCode(204)
  async unmarkSeen(@CurrentSession() { user }: AuthSession) {
    await this.today.markSeen(user.id, false);
  }

  @Post("bell")
  @HttpCode(204)
  async openBell(@CurrentSession() { user }: AuthSession) {
    await this.today.openBell(user.id);
  }
}
