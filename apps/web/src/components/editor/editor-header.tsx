import { X } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "~/components/ui/button";
import type { EditorMode } from "./card-editor";

// The editor is a whole page with no tab bar: close on the left, the main action on the right.
export function EditorHeader({
  deckName,
  mode,
  onClose,
  right,
  closeLabel = "Fechar o editor",
}: {
  deckName?: string;
  mode: EditorMode["kind"];
  onClose: () => void;
  right: ReactNode;
  closeLabel?: string;
}) {
  let title = "Adicionar Cards";
  let subtitle = deckName ? `em ${deckName}` : "";
  if (mode === "edit") {
    title = "Editar Card";
    subtitle = deckName ?? "";
  } else if (mode === "new-deck") {
    title = "Novo Deck";
    subtitle ||= "Dê um nome e crie os primeiros Cards";
  }
  return (
    <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-2 px-2 md:h-16 md:px-4">
        <Button
          aria-label={closeLabel}
          onClick={onClose}
          size="icon"
          variant="ghost"
        >
          <X className="size-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-heading font-semibold text-lg leading-tight">
            {title}
          </p>
          <p className="truncate text-muted-foreground text-xs">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">{right}</div>
      </div>
    </header>
  );
}
