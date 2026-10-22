import { toPlainText } from "@daruma/shared";
import { cn } from "cn";
import { Plus } from "lucide-react";
import { type MouseEvent, useCallback } from "react";
import type { SavedCard } from "./card-editor";

// The Cards already saved in this batch as numbered pills, then the Card being written.
// A pill opens that Card again; "+ Card N" goes back to the new one.
export function BatchStrip({
  cards,
  editingId,
  flashId,
  onBackToNew,
  onOpen,
}: {
  cards: SavedCard[];
  editingId: string | null;
  flashId: string | null;
  onBackToNew: () => void;
  onOpen: (id: string) => void;
}) {
  // Each pill carries data-card-id so one handler serves them all.
  const open = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      const id = event.currentTarget.dataset.cardId;
      if (id) {
        onOpen(id);
      }
    },
    [onOpen]
  );

  return (
    <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 py-1">
      {cards.map((card, index) => (
        <button
          className={cn(
            "h-9 min-w-9 shrink-0 rounded-full border px-3 text-sm tabular-nums transition",
            card.id === editingId
              ? "border-primary bg-primary text-primary-foreground"
              : "bg-card hover:bg-accent",
            card.id === flashId &&
              "ring-2 ring-primary ring-offset-2 ring-offset-background"
          )}
          data-card-id={card.id}
          key={card.id}
          onClick={open}
          title={toPlainText(card.question)}
          type="button"
        >
          {index + 1}
        </button>
      ))}
      <button
        className={cn(
          "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm",
          editingId
            ? "border-dashed text-muted-foreground hover:bg-accent"
            : "border-primary bg-primary text-primary-foreground"
        )}
        disabled={!editingId}
        onClick={onBackToNew}
        type="button"
      >
        <Plus className="size-4" />
        Card {cards.length + 1}
      </button>
    </div>
  );
}
