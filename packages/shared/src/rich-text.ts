import { z } from "zod";

// A Card's question and answer are Tiptap JSON. Only what the editor can produce is accepted:
// paragraphs, lists, code, images uploaded to the API, and LaTeX formulas.

// An image the API stored (see apps/api/src/images). Anything else would load from elsewhere.
export const IMAGE_SRC = /^\/api\/images\/[0-9a-f-]{36}\.(png|jpg|webp|gif)$/;

export interface RichTextNode {
  attrs?: Record<string, unknown>;
  content?: RichTextNode[];
  marks?: { type: "bold" | "italic" | "code" }[];
  text?: string;
  type: string;
}

const markSchema = z.object({ type: z.enum(["bold", "italic", "code"]) });

export const richTextNodeSchema: z.ZodType<RichTextNode> = z.lazy(() =>
  z.union([
    z.object({
      marks: z.array(markSchema).optional(),
      text: z.string().min(1),
      type: z.literal("text"),
    }),
    z.object({ type: z.literal("hardBreak") }),
    z.object({
      attrs: z.looseObject({ src: z.string().regex(IMAGE_SRC) }),
      type: z.literal("image"),
    }),
    z.object({
      attrs: z.looseObject({ latex: z.string().max(2000) }),
      type: z.enum(["inlineMath", "blockMath"]),
    }),
    z.object({
      attrs: z.looseObject({}).optional(),
      content: z.array(richTextNodeSchema).optional(),
      type: z.enum([
        "paragraph",
        "bulletList",
        "orderedList",
        "listItem",
        "codeBlock",
      ]),
    }),
  ])
);

export const richTextSchema = z.object({
  content: z.array(richTextNodeSchema).optional(),
  type: z.literal("doc"),
});

export type RichText = z.infer<typeof richTextSchema>;

export const EMPTY_RICH_TEXT: RichText = { content: [], type: "doc" };

const BLOCKS = new Set(["paragraph", "listItem", "codeBlock", "blockMath"]);

// The text of a document, one line per block, formulas as their LaTeX. Kept beside the JSON
// for search and list previews.
export function toPlainText(doc: RichText): string {
  const lines: string[] = [];
  let line = "";
  const walk = (node: RichTextNode) => {
    if (node.type === "text") {
      line += node.text ?? "";
    } else if (node.type === "hardBreak") {
      line += " ";
    } else if (node.type === "inlineMath" || node.type === "blockMath") {
      line += String(node.attrs?.latex ?? "");
    }
    for (const child of node.content ?? []) {
      walk(child);
    }
    if (BLOCKS.has(node.type) && line.trim()) {
      lines.push(line.trim());
      line = "";
    }
  };
  walk(doc);
  if (line.trim()) {
    lines.push(line.trim());
  }
  return lines.join("\n");
}

const hasMedia = (node: RichTextNode): boolean =>
  node.type === "image" ||
  ((node.type === "inlineMath" || node.type === "blockMath") &&
    String(node.attrs?.latex ?? "").trim() !== "") ||
  (node.content ?? []).some(hasMedia);

// A side of a Card counts as written if it has text, an image or a formula.
export const hasContent = (doc: RichText) =>
  toPlainText(doc) !== "" || hasMedia(doc);
