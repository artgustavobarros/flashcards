import { Module } from "@nestjs/common";
import { SchedulingModule } from "../scheduling/scheduling.module.js";
import { DecksController } from "./decks.controller.js";
import { DecksService } from "./decks.service.js";

@Module({
  controllers: [DecksController],
  imports: [SchedulingModule],
  providers: [DecksService],
})
export class DecksModule {}
