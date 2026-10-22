import { useQuery } from "@tanstack/react-query";
import { Layers } from "lucide-react";
import {
  type ChangeEvent,
  type MouseEvent,
  useCallback,
  useState,
} from "react";
import { ResponsiveDialog } from "~/components/responsive-dialog";
import { Input } from "~/components/ui/input";
import { decksQuery } from "~/lib/queries";
import { plural } from "~/lib/schedule";

// Accent-blind, case-blind match, like the Cards search.
const fold = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

export function MoveCardDialog({
  currentDeckId,
  onMove,
  onOpenChange,
  open,
}: {
  currentDeckId: string;
  onMove: (deck: { id: string; name: string }) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  return (
    <ResponsiveDialog
      description="Mover este Card. O agendamento não muda."
      onOpenChange={onOpenChange}
      open={open}
      title="Mover para Deck"
    >
      <DeckPicker currentDeckId={currentDeckId} onMove={onMove} />
    </ResponsiveDialog>
  );
}

function DeckPicker({
  currentDeckId,
  onMove,
}: {
  currentDeckId: string;
  onMove: (deck: { id: string; name: string }) => void;
}) {
  const [search, setSearch] = useState("");
  const decks = useQuery(decksQuery).data?.decks ?? [];
  const term = fold(search.trim());
  const rows = decks.filter((deck) => fold(deck.name).includes(term));
  const onSearch = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => setSearch(event.target.value),
    []
  );
  // Each row carries data-deck-id so one handler serves the whole list.
  const pick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      const deck = decks.find(
        (row) => row.id === event.currentTarget.dataset.deckId
      );
      if (deck) {
        onMove(deck);
      }
    },
    [decks, onMove]
  );

  return (
    <>
      <Input
        aria-label="Buscar Deck"
        className="rounded-full px-4"
        onChange={onSearch}
        placeholder="Buscar Deck…"
        value={search}
      />
      <div className="-mx-2 mt-2 overflow-y-auto">
        {rows.map((deck) => {
          const here = deck.id === currentDeckId;
          return (
            <button
              className="flex w-full items-center gap-3 rounded-md px-2.5 py-2.5 text-left hover:bg-accent disabled:opacity-60"
              data-deck-id={deck.id}
              disabled={here}
              key={deck.id}
              onClick={pick}
              type="button"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                <Layers className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-sm">
                  {deck.name}
                </span>
                <span className="block text-muted-foreground text-xs">
                  {here
                    ? "Deck atual"
                    : plural(deck.cardCount, "card", "cards")}
                </span>
              </span>
            </button>
          );
        })}
        {rows.length ? null : (
          <p className="py-6 text-center text-muted-foreground text-sm">
            Nenhum Deck encontrado.
          </p>
        )}
      </div>
    </>
  );
}
