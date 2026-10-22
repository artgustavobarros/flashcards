import { Module } from "@nestjs/common";
import { CLOCK, type Clock, SchedulingService } from "./scheduling.service.js";

@Module({
  exports: [SchedulingService],
  providers: [
    SchedulingService,
    { provide: CLOCK, useValue: (() => new Date()) satisfies Clock },
  ],
})
export class SchedulingModule {}
