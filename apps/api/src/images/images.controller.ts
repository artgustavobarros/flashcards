import {
  BadRequestException,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
  Res,
  UnsupportedMediaTypeException,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Response } from "express";
import { CurrentSession } from "../auth/auth.guard.js";
import type { AuthSession } from "../auth/auth.js";
import {
  IMAGE_FILE,
  ImagesService,
  imageType,
  MAX_IMAGE_BYTES,
} from "./images.service.js";

@Controller("images")
export class ImagesController {
  constructor(@Inject(ImagesService) private readonly images: ImagesService) {}

  // multipart/form-data with one "file" field. Over the limit, multer answers 413.
  @Post()
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
    })
  )
  async upload(
    @CurrentSession() { user }: AuthSession,
    @UploadedFile() file?: Express.Multer.File
  ) {
    if (!file) {
      throw new BadRequestException("Envie uma imagem.");
    }
    const type = imageType(file.buffer);
    if (!type) {
      throw new UnsupportedMediaTypeException("Use PNG, JPG, WebP ou GIF.");
    }
    const name = await this.images.save(user.id, file.buffer, type);
    return { src: `/api/images/${name}` };
  }

  // Names are random and never reused, so the browser can keep the file for good.
  @Get(":file")
  serve(
    @CurrentSession() { user }: AuthSession,
    @Param("file") file: string,
    @Res() res: Response
  ) {
    if (!IMAGE_FILE.test(file)) {
      throw new NotFoundException();
    }
    res.sendFile(
      file,
      {
        headers: { "X-Content-Type-Options": "nosniff" },
        immutable: true,
        maxAge: "365d",
        root: this.images.folder(user.id),
      },
      (error) => {
        if (error && !res.headersSent) {
          res.status(404).end();
        }
      }
    );
  }
}
