import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module.js";
import { CardsModule } from "./cards/cards.module.js";
import { DbModule } from "./db/db.module.js";
import { DecksModule } from "./decks/decks.module.js";
import { HealthController } from "./health/health.controller.js";
import { ImagesModule } from "./images/images.module.js";
import { SchedulingModule } from "./scheduling/scheduling.module.js";

@Module({
  controllers: [HealthController],
  imports: [
    DbModule,
    AuthModule,
    SchedulingModule,
    DecksModule,
    CardsModule,
    ImagesModule,
  ],
})
export class AppModule {}
