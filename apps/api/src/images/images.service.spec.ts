import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { hasContent, richTextSchema } from "@daruma/shared";
import { afterAll, describe, expect, test } from "vitest";
import { IMAGE_FILE, ImagesService, imageType } from "./images.service.js";

const root = await mkdtemp(join(tmpdir(), "daruma-images-"));
afterAll(() => rm(root, { force: true, recursive: true }));

const PNG = Buffer.from("89504e470d0a1a0a0000000d49484452", "hex");

describe("imageType", () => {
  test("reads the type from the bytes", () => {
    expect(imageType(PNG)).toBe("png");
    expect(imageType(Buffer.from("ffd8ffe000104a46", "hex"))).toBe("jpg");
    expect(imageType(Buffer.from("GIF89a\x01\x00", "latin1"))).toBe("gif");
    expect(
      imageType(Buffer.from("RIFF\x00\x00\x00\x00WEBPVP8 ", "latin1"))
    ).toBe("webp");
  });

  test("refuses anything else, SVG included", () => {
    expect(
      imageType(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg">'))
    ).toBeNull();
    expect(imageType(Buffer.from("not an image"))).toBeNull();
  });
});

test("saves into the user's own folder under a fresh name", async () => {
  const service = new ImagesService(root);
  const file = await service.save("user-1", PNG, "png");

  expect(file).toMatch(IMAGE_FILE);
  expect(await readFile(join(service.folder("user-1"), file))).toEqual(PNG);
});

describe("rich text", () => {
  const image = (src: string) => ({
    content: [{ attrs: { alt: null, src }, type: "image" }],
    type: "doc",
  });

  test("accepts only images the API stored", () => {
    const src = "/api/images/0b5e6a52-1f0c-4c8e-9b7c-3f1d2a4b5c6d.png";
    expect(richTextSchema.safeParse(image(src)).success).toBe(true);
    expect(
      richTextSchema.safeParse(image("https://evil.example/x.png")).success
    ).toBe(false);
    expect(hasContent(richTextSchema.parse(image(src)))).toBe(true);
  });

  test("refuses nodes the editor does not make", () => {
    expect(
      richTextSchema.safeParse({
        content: [{ content: [], type: "heading" }],
        type: "doc",
      }).success
    ).toBe(false);
  });
});
