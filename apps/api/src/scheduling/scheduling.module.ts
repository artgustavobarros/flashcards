import { Module } from "@nestjs/common";
import { ReviewsController } from "./reviews.controller.js";
import { CLOCK, type Clock, SchedulingService } from "./scheduling.service.js";

@Module({
  controllers: [ReviewsController],
  exports: [SchedulingService],
  providers: [
    SchedulingService,
    { provide: CLOCK, useValue: (() => new Date()) satisfies Clock },
  ],
})
export class SchedulingModule {}
