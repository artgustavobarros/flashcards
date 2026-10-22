import { Module } from "@nestjs/common";
import { env } from "../env.js";
import { ImagesController } from "./images.controller.js";
import { ImagesService, UPLOADS_DIR } from "./images.service.js";

@Module({
  controllers: [ImagesController],
  providers: [
    ImagesService,
    { provide: UPLOADS_DIR, useValue: env.UPLOADS_DIR },
  ],
})
export class ImagesModule {}
