import { Module } from "@nestjs/common";
import { SchedulingModule } from "../scheduling/scheduling.module.js";
import { TodayController } from "./today.controller.js";
import { TodayService } from "./today.service.js";

@Module({
  controllers: [TodayController],
  imports: [SchedulingModule],
  providers: [TodayService],
})
export class TodayModule {}
