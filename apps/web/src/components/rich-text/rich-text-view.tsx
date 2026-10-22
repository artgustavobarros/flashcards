import type { RichText } from "@daruma/shared";
import { EditorContent, useEditor } from "@tiptap/react";
import { cn } from "cn";
import { mathExtension, richTextExtensions } from "./extensions";

const extensions = [...richTextExtensions, mathExtension()];

// A question or answer as the person wrote it, read-only.
export function RichTextView({
  className,
  doc,
}: {
  className?: string;
  doc: RichText;
}) {
  const editor = useEditor(
    { content: doc, editable: false, extensions, immediatelyRender: true },
    [doc]
  );
  return (
    <EditorContent className={cn("rich-text", className)} editor={editor} />
  );
}
