import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module.js";
import { DbModule } from "./db/db.module.js";
import { HealthController } from "./health/health.controller.js";

@Module({
  controllers: [HealthController],
  imports: [DbModule, AuthModule],
})
export class AppModule {}
