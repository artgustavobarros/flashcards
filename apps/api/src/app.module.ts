import { Module } from "@nestjs/common";
import { DbModule } from "./db/db.module.js";
import { HealthController } from "./health/health.controller.js";

@Module({
  controllers: [HealthController],
  imports: [DbModule],
})
export class AppModule {}
