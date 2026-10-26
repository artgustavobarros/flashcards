import { Module } from "@nestjs/common";
import { SchedulingModule } from "../scheduling/scheduling.module.js";
import { ProgressController } from "./progress.controller.js";
import { ProgressService } from "./progress.service.js";

@Module({
  controllers: [ProgressController],
  imports: [SchedulingModule],
  providers: [ProgressService],
})
export class ProgressModule {}
