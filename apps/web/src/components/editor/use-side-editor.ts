import { hasContent, type RichText } from "@daruma/shared";
import { Placeholder } from "@tiptap/extensions";
import type { EditorView } from "@tiptap/pm/view";
import { type Editor, useEditor } from "@tiptap/react";
import { useRef } from "react";
import { toast } from "sonner";
import {
  mathExtension,
  richTextExtensions,
} from "~/components/rich-text/extensions";
import { ApiError, uploadImage } from "~/lib/api";

export const IMAGE_TYPES = "image/png,image/jpeg,image/webp,image/gif";

const IMG_TAG = /<img\b[^>]*>/gi;

function uploadError(error: unknown) {
  if (error instanceof ApiError && error.status === 413) {
    return "A imagem passa de 5 MB.";
  }
  if (error instanceof ApiError && error.status === 415) {
    return "Use PNG, JPG, WebP ou GIF.";
  }
  return "Não foi possível enviar a imagem.";
}

// Uploads the images and inserts the ones that made it at `pos`, or at the cursor, in order.
export async function insertImages(
  editor: Editor,
  files: File[],
  pos?: number
) {
  const results = await Promise.allSettled(files.map(uploadImage));
  const images: { attrs: { src: string }; type: "image" }[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      images.push({ attrs: { src: result.value }, type: "image" });
    } else {
      toast.error(uploadError(result.reason));
    }
  }
  if (!images.length) {
    return;
  }
  if (pos === undefined) {
    editor.chain().focus().insertContent(images).run();
  } else {
    editor.chain().focus().insertContentAt(pos, images).run();
  }
}

const imageFiles = (list: FileList | null | undefined) =>
  Array.from(list ?? []).filter((file) => file.type.startsWith("image/"));

export const isFilled = (editor: Editor | null) =>
  !!editor && hasContent(editor.getJSON() as RichText);

// One side of the Card (question or answer). Images can be pasted or dropped in; images in
// pasted HTML are dropped, since only images uploaded to the API are allowed.
export function useSideEditor({
  content,
  onChange,
  onFormulaClick,
  placeholder,
}: {
  content?: RichText;
  onChange: () => void;
  onFormulaClick: (latex: string, pos: number) => void;
  placeholder: string;
}) {
  // The editor is created once; the latest callbacks are read through refs.
  const callbacks = useRef({ onChange, onFormulaClick });
  callbacks.current = { onChange, onFormulaClick };
  const editorRef = useRef<Editor | null>(null);

  const handleFiles = (files: File[], view: EditorView, pos?: number) => {
    if (!(files.length && editorRef.current)) {
      return false;
    }
    insertImages(editorRef.current, files, pos ?? view.state.selection.from);
    return true;
  };

  const editor = useEditor({
    content,
    editorProps: {
      attributes: { class: "min-h-[inherit] outline-none" },
      handleDrop: (view, event, _slice, moved) => {
        if (moved) {
          return false;
        }
        const files = imageFiles(event.dataTransfer?.files);
        const pos = view.posAtCoords({
          left: event.clientX,
          top: event.clientY,
        })?.pos;
        if (handleFiles(files, view, pos)) {
          event.preventDefault();
          return true;
        }
        return false;
      },
      handlePaste: (view, event) =>
        handleFiles(imageFiles(event.clipboardData?.files), view),
      transformPastedHTML: (html) => html.replace(IMG_TAG, ""),
    },
    extensions: [
      ...richTextExtensions,
      mathExtension({
        inlineOptions: {
          onClick: (node, pos) =>
            callbacks.current.onFormulaClick(String(node.attrs.latex), pos),
        },
      }),
      Placeholder.configure({ placeholder }),
    ],
    immediatelyRender: true,
    onUpdate: () => callbacks.current.onChange(),
  });
  editorRef.current = editor;
  return editor;
}
