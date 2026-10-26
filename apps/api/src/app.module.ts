import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module.js";
import { CardsModule } from "./cards/cards.module.js";
import { CommentsModule } from "./comments/comments.module.js";
import { DbModule } from "./db/db.module.js";
import { DecksModule } from "./decks/decks.module.js";
import { HealthController } from "./health/health.controller.js";
import { ImagesModule } from "./images/images.module.js";
import { LabelsModule } from "./labels/labels.module.js";
import { SchedulingModule } from "./scheduling/scheduling.module.js";
import { SettingsController } from "./settings/settings.controller.js";
import { TodayModule } from "./today/today.module.js";

@Module({
  controllers: [HealthController, SettingsController],
  imports: [
    DbModule,
    AuthModule,
    SchedulingModule,
    DecksModule,
    CardsModule,
    LabelsModule,
    CommentsModule,
    ImagesModule,
    TodayModule,
  ],
})
export class AppModule {}
