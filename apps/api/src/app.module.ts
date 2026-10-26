import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module.js";
import { CardsModule } from "./cards/cards.module.js";
import { CommentsModule } from "./comments/comments.module.js";
import { DbModule } from "./db/db.module.js";
import { DecksModule } from "./decks/decks.module.js";
import { HealthController } from "./health/health.controller.js";
import { ImagesModule } from "./images/images.module.js";
import { LabelsModule } from "./labels/labels.module.js";
import { ProgressModule } from "./progress/progress.module.js";
import { SchedulingModule } from "./scheduling/scheduling.module.js";
import { SettingsModule } from "./settings/settings.module.js";
import { TodayModule } from "./today/today.module.js";

@Module({
  controllers: [HealthController],
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
    ProgressModule,
    SettingsModule,
  ],
})
export class AppModule {}
