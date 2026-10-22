import type { Editor } from "@tiptap/react";
import {
  Bold,
  Code,
  Image,
  Italic,
  List,
  ListOrdered,
  type LucideIcon,
  Sigma,
  SquareCode,
} from "lucide-react";
import {
  type ChangeEvent,
  Fragment,
  type MouseEvent,
  useCallback,
  useRef,
} from "react";
import { IMAGE_TYPES, insertImages } from "./use-side-editor";

type Command =
  | "bold"
  | "italic"
  | "bulletList"
  | "orderedList"
  | "code"
  | "codeBlock"
  | "image"
  | "formula";

const GROUPS: { command: Command; icon: LucideIcon; label: string }[][] = [
  [
    { command: "bold", icon: Bold, label: "Negrito (Ctrl+B)" },
    { command: "italic", icon: Italic, label: "Itálico (Ctrl+I)" },
  ],
  [
    { command: "bulletList", icon: List, label: "Lista" },
    { command: "orderedList", icon: ListOrdered, label: "Lista numerada" },
  ],
  [
    { command: "code", icon: Code, label: "Código na linha" },
    { command: "codeBlock", icon: SquareCode, label: "Bloco de código" },
  ],
  [
    {
      command: "image",
      icon: Image,
      label: "Imagem (também dá para colar ou arrastar)",
    },
    { command: "formula", icon: Sigma, label: "Fórmula" },
  ],
];

// Below the Card. Buttons keep the focus in the text (mousedown is prevented).
export function EditorToolbar({
  editor,
  onFormula,
}: {
  editor: Editor | null;
  onFormula: () => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);

  const keepFocus = useCallback(
    (event: MouseEvent) => event.preventDefault(),
    []
  );
  // Each button carries data-command so one handler serves the whole bar.
  const run = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      if (!editor) {
        return;
      }
      const chain = editor.chain().focus();
      switch (event.currentTarget.dataset.command as Command) {
        case "bold":
          chain.toggleBold().run();
          break;
        case "italic":
          chain.toggleItalic().run();
          break;
        case "bulletList":
          chain.toggleBulletList().run();
          break;
        case "orderedList":
          chain.toggleOrderedList().run();
          break;
        case "code":
          chain.toggleCode().run();
          break;
        case "codeBlock":
          chain.toggleCodeBlock().run();
          break;
        case "image":
          fileInput.current?.click();
          break;
        case "formula":
          onFormula();
          break;
        default:
          break;
      }
    },
    [editor, onFormula]
  );
  const onFiles = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files ?? []);
      event.target.value = "";
      if (editor) {
        insertImages(editor, files);
      }
    },
    [editor]
  );

  return (
    <div className="flex items-center gap-0.5 overflow-x-auto border-t bg-muted/40 px-2 py-1.5">
      {GROUPS.map((group, index) => (
        <Fragment key={group[0]?.command}>
          {index ? <span className="mx-1 h-5 w-px shrink-0 bg-border" /> : null}
          {group.map(({ command, icon: Icon, label }) => (
            <button
              aria-label={label}
              className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
              data-command={command}
              key={command}
              onClick={run}
              onMouseDown={keepFocus}
              tabIndex={-1}
              title={label}
              type="button"
            >
              <Icon className="size-4" />
            </button>
          ))}
        </Fragment>
      ))}
      <input
        accept={IMAGE_TYPES}
        className="hidden"
        multiple
        onChange={onFiles}
        ref={fileInput}
        type="file"
      />
    </div>
  );
}
