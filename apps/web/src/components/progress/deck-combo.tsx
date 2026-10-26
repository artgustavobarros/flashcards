import { foldText, type ProgressDeck } from "@daruma/shared";
import { cn } from "cn";
import { Check, ChevronsUpDown, Layers, Search } from "lucide-react";
import {
  type ChangeEvent,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  useCallback,
  useId,
  useState,
} from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { useMediaQuery } from "~/hooks/use-media-query";
import { percent } from "~/lib/progress";
import { plural } from "~/lib/schedule";

interface Option {
  cardCount: number;
  id: string | undefined;
  name: string;
  pct: number | null;
  today: number;
}

const sum = (decks: ProgressDeck[], key: keyof ProgressDeck) =>
  decks.reduce((total, deck) => total + Number(deck[key]), 0);

function DeckIcon({ all, className }: { all: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-md",
        all ? "bg-muted text-muted-foreground" : "bg-primary/15 text-primary",
        className
      )}
    >
      <Layers className="size-3.5" />
    </span>
  );
}

// The Deck filter: a pill with the Deck chosen, opening a searchable list (accents ignored)
// with each Deck's Cards, its share of today and its % of right answers in the period. Arrows,
// Enter and Esc work; on a phone the search doesn't take focus by itself.
export function DeckCombo({
  deckId,
  decks,
  onPick,
}: {
  deckId: string | undefined;
  decks: ProgressDeck[];
  onPick: (deckId: string | undefined) => void;
}) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [cursor, setCursor] = useState(0);
  const wide = useMediaQuery("(min-width: 640px)");
  const listId = useId();

  const all: Option = {
    cardCount: sum(decks, "cardCount"),
    id: undefined,
    name: "Todos os Decks",
    pct: percent(sum(decks, "reviews"), sum(decks, "errors")),
    today: sum(decks, "today"),
  };
  const options: Option[] = [
    all,
    ...decks.map((deck) => ({
      ...deck,
      pct: percent(deck.reviews, deck.errors),
    })),
  ];
  const folded = foldText(term.trim());
  const rows = options.filter(
    (option) => !(folded && option.id) || foldText(option.name).includes(folded)
  );
  const chosen = options.find((option) => option.id === deckId) ?? all;

  const pick = useCallback(
    (id: string | undefined) => {
      setOpen(false);
      onPick(id);
    },
    [onPick]
  );
  const toggle = useCallback((next: boolean) => {
    setOpen(next);
    setTerm("");
    setCursor(0);
  }, []);
  const keepFocusOnPhone = useCallback(
    (event: Event) => {
      if (!wide) {
        event.preventDefault();
      }
    },
    [wide]
  );
  const search = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setTerm(event.target.value);
    setCursor(0);
  }, []);
  const keys = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      const row = rows[cursor];
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const move = event.key === "ArrowDown" ? 1 : -1;
        setCursor((i) => (i + move + rows.length) % Math.max(1, rows.length));
      } else if (event.key === "Enter" && row) {
        event.preventDefault();
        pick(row.id);
      }
    },
    [cursor, pick, rows]
  );
  const choose = useCallback(
    (event: MouseEvent<HTMLButtonElement>) =>
      pick(event.currentTarget.dataset.value || undefined),
    [pick]
  );
  const point = useCallback(
    (event: PointerEvent<HTMLButtonElement>) =>
      setCursor(Number(event.currentTarget.dataset.index)),
    []
  );

  return (
    <Popover onOpenChange={toggle} open={open}>
      <PopoverTrigger asChild>
        <button
          aria-controls={listId}
          aria-haspopup="listbox"
          className="flex h-10 w-full items-center gap-2.5 rounded-full border border-input bg-background pr-3 pl-1.5 text-left text-sm transition-colors hover:bg-accent data-[state=open]:ring-2 data-[state=open]:ring-ring/30 sm:w-64"
          type="button"
        >
          <DeckIcon all={!chosen.id} className="size-7" />
          <span className="min-w-0 flex-1 truncate font-medium">
            {chosen.name}
          </span>
          <ChevronsUpDown className="size-4 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) gap-0 p-1.5 sm:w-80"
        onOpenAutoFocus={keepFocusOnPhone}
      >
        <div className="flex items-center gap-2 border-b px-2.5 pb-1.5 text-muted-foreground">
          <Search className="size-4" />
          <input
            aria-activedescendant={
              rows[cursor] ? `${listId}-${cursor}` : undefined
            }
            aria-controls={listId}
            aria-expanded
            aria-label="Buscar Deck"
            className="h-9 min-w-0 flex-1 bg-transparent text-foreground text-sm outline-none placeholder:text-muted-foreground"
            onChange={search}
            onKeyDown={keys}
            placeholder="Buscar Deck…"
            role="combobox"
            type="text"
            value={term}
          />
        </div>
        <div
          className="max-h-72 overflow-y-auto pt-1.5"
          id={listId}
          role="listbox"
        >
          {folded && rows.length === 1 ? (
            <p className="px-3 py-6 text-center text-muted-foreground text-sm">
              Nenhum Deck encontrado.
            </p>
          ) : (
            rows.map((option, i) => {
              const selected = option.id === chosen.id;
              return (
                <button
                  aria-selected={selected}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left hover:bg-accent",
                    i === cursor && "bg-accent"
                  )}
                  data-index={i}
                  data-value={option.id}
                  id={`${listId}-${i}`}
                  key={option.id ?? "all"}
                  onClick={choose}
                  onPointerMove={point}
                  role="option"
                  tabIndex={-1}
                  type="button"
                >
                  <DeckIcon all={!option.id} className="size-8" />
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block truncate text-sm",
                        selected ? "font-semibold" : "font-medium"
                      )}
                    >
                      {option.name}
                    </span>
                    <span className="block text-muted-foreground text-xs tabular-nums">
                      {plural(option.cardCount, "card", "cards")}
                      {option.today ? ` · ${option.today} para hoje` : ""}
                    </span>
                  </span>
                  {option.pct === null ? null : (
                    <span className="text-muted-foreground text-xs tabular-nums">
                      {option.pct}%
                    </span>
                  )}
                  <span className="w-4 text-primary">
                    {selected ? <Check className="size-4" /> : null}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
