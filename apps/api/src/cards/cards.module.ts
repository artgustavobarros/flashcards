import { Module } from "@nestjs/common";
import { SchedulingModule } from "../scheduling/scheduling.module.js";
import { CardsController } from "./cards.controller.js";
import { CardsService } from "./cards.service.js";

@Module({
  controllers: [CardsController],
  imports: [SchedulingModule],
  providers: [CardsService],
})
export class CardsModule {}
