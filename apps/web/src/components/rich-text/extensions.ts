import Image from "@tiptap/extension-image";
import {
  Mathematics,
  type MathematicsOptions,
} from "@tiptap/extension-mathematics";
import StarterKit from "@tiptap/starter-kit";

// The nodes and marks a Card can hold: the same list richTextSchema accepts in
// packages/shared. Anything else pasted in (headings, links, quotes…) becomes plain paragraphs.
export const richTextExtensions = [
  StarterKit.configure({
    blockquote: false,
    heading: false,
    horizontalRule: false,
    link: false,
    strike: false,
    underline: false,
  }),
  Image,
];

// The editor passes click handlers to edit a formula; the read-only view passes nothing.
export const mathExtension = (
  options: Pick<MathematicsOptions, "blockOptions" | "inlineOptions"> = {}
) =>
  Mathematics.configure({
    ...options,
    katexOptions: { throwOnError: false },
  });
