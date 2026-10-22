import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { Inject, Injectable } from "@nestjs/common";

export const UPLOADS_DIR = Symbol("UPLOADS_DIR");

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

// The name an image is served under: /api/images/<uuid>.<ext>.
export const IMAGE_FILE = /^[0-9a-f-]{36}\.(png|jpg|webp|gif)$/;

const startsWith = (bytes: Buffer, signature: string, offset = 0) =>
  bytes.subarray(offset, offset + signature.length).toString("latin1") ===
  signature;

// Trusts the file's bytes, not its name or the browser's MIME type. No SVG: it can carry scripts.
export function imageType(bytes: Buffer) {
  if (startsWith(bytes, "\x89PNG\r\n\x1a\n")) {
    return "png";
  }
  if (startsWith(bytes, "\xff\xd8\xff")) {
    return "jpg";
  }
  if (startsWith(bytes, "GIF87a") || startsWith(bytes, "GIF89a")) {
    return "gif";
  }
  if (startsWith(bytes, "RIFF") && startsWith(bytes, "WEBP", 8)) {
    return "webp";
  }
  return null;
}

// Card images live on disk, one folder per user (a Docker volume in production). A user can only
// ever read from their own folder, which is the owner check.
@Injectable()
export class ImagesService {
  constructor(@Inject(UPLOADS_DIR) private readonly root: string) {}

  folder(userId: string) {
    return resolve(this.root, userId);
  }

  async save(userId: string, bytes: Buffer, type: string) {
    const file = `${randomUUID()}.${type}`;
    const folder = this.folder(userId);
    await mkdir(folder, { recursive: true });
    await writeFile(join(folder, file), bytes, { flag: "wx" });
    return file;
  }
}
