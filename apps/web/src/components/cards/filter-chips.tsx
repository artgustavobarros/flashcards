import type { CardState } from "@daruma/shared";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { cn } from "cn";
import { Check, ChevronDown, Tag } from "lucide-react";
import { type ReactNode, useCallback } from "react";
import { deckCountsLine } from "~/components/decks/deck-counts";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import type { CardFilters } from "~/lib/card-filters";
import { decksQuery, labelsQuery } from "~/lib/queries";
import { plural, STATE_LABEL } from "~/lib/schedule";

const chipClass = (active: boolean) =>
  cn(
    "inline-flex h-9 max-w-full items-center gap-1.5 rounded-full border px-3.5 text-sm transition",
    active
      ? "border-foreground bg-foreground text-background"
      : "bg-card hover:bg-accent"
  );

// A chip that opens a menu. Active, it is dark and shows the chosen value.
function ChipMenu({
  children,
  label,
  value,
}: {
  children: ReactNode;
  label: string;
  value?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={chipClass(Boolean(value))}>
        <span className="max-w-40 truncate">{value ?? label}</span>
        <ChevronDown className="size-4 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-64 max-w-[calc(100vw-2.5rem)] p-1.5"
      >
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// One option: its value in data-value, so each menu has one handler.
function Option({
  hint,
  label,
  onSelect,
  selected,
  value,
}: {
  hint?: string;
  label: string;
  onSelect: (event: Event) => void;
  selected: boolean;
  value: string;
}) {
  return (
    <DropdownMenuItem
      className="gap-3 px-2.5 py-2"
      data-value={value}
      onSelect={onSelect}
    >
      <span className="min-w-0 flex-1">
        <span className={cn("block truncate", selected && "font-semibold")}>
          {label}
        </span>
        {hint ? (
          <span className="block text-muted-foreground text-xs">{hint}</span>
        ) : null}
      </span>
      <span className="w-4 text-primary">
        {selected ? <Check className="size-4" /> : null}
      </span>
    </DropdownMenuItem>
  );
}

const optionValue = (event: Event) =>
  (event.currentTarget as HTMLElement).dataset.value || undefined;

const STATES = Object.entries(STATE_LABEL) as [CardState, string][];

// Deck ▾ (not on a Deck page), Label ▾, Estado ▾ and "Vencido hoje", plus "Limpar".
export function FilterChips({
  filters,
  inDeck,
  onChange,
  onClear,
  showClear,
}: {
  filters: CardFilters;
  inDeck: boolean;
  onChange: (patch: Partial<CardFilters>) => void;
  onClear: () => void;
  showClear: boolean;
}) {
  const decks = useQuery(decksQuery).data?.decks ?? [];
  const labels = useQuery(labelsQuery).data?.labels ?? [];

  const pickDeck = useCallback(
    (event: Event) => onChange({ deckId: optionValue(event) }),
    [onChange]
  );
  const pickLabel = useCallback(
    (event: Event) => onChange({ labelId: optionValue(event) }),
    [onChange]
  );
  const pickState = useCallback(
    (event: Event) =>
      onChange({ state: optionValue(event) as CardState | undefined }),
    [onChange]
  );
  const toggleDue = useCallback(
    () => onChange({ due: filters.due ? undefined : "today" }),
    [filters.due, onChange]
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      {inDeck ? null : (
        <ChipMenu
          label="Deck"
          value={decks.find((deck) => deck.id === filters.deckId)?.name}
        >
          <Option
            label="Todos os Decks"
            onSelect={pickDeck}
            selected={!filters.deckId}
            value=""
          />
          <div className="max-h-60 overflow-y-auto">
            {decks.map((deck) => (
              <Option
                hint={deckCountsLine(deck)}
                key={deck.id}
                label={deck.name}
                onSelect={pickDeck}
                selected={filters.deckId === deck.id}
                value={deck.id}
              />
            ))}
          </div>
        </ChipMenu>
      )}
      <ChipMenu
        label="Label"
        value={labels.find((label) => label.id === filters.labelId)?.name}
      >
        {labels.length ? (
          <>
            <Option
              label="Qualquer Label"
              onSelect={pickLabel}
              selected={!filters.labelId}
              value=""
            />
            <div className="max-h-60 overflow-y-auto">
              {labels.map((label) => (
                <Option
                  hint={plural(label.cardCount, "card", "cards")}
                  key={label.id}
                  label={label.name}
                  onSelect={pickLabel}
                  selected={filters.labelId === label.id}
                  value={label.id}
                />
              ))}
            </div>
          </>
        ) : (
          <p className="px-2.5 py-3 text-muted-foreground text-sm">
            Nenhuma Label ainda.
          </p>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="gap-2 px-2.5 py-2 text-primary">
          <Link to="/decks/labels">
            <Tag />
            Gerenciar Labels
          </Link>
        </DropdownMenuItem>
      </ChipMenu>
      <ChipMenu
        label="Estado"
        value={filters.state ? STATE_LABEL[filters.state] : undefined}
      >
        <Option
          label="Qualquer estado"
          onSelect={pickState}
          selected={!filters.state}
          value=""
        />
        {STATES.map(([state, label]) => (
          <Option
            key={state}
            label={label}
            onSelect={pickState}
            selected={filters.state === state}
            value={state}
          />
        ))}
      </ChipMenu>
      <button
        aria-pressed={Boolean(filters.due)}
        className={chipClass(Boolean(filters.due))}
        onClick={toggleDue}
        type="button"
      >
        {filters.due ? <Check className="size-4" /> : null}
        Vencido hoje
      </button>
      {showClear ? (
        <Button className="px-1" onClick={onClear} size="sm" variant="link">
          Limpar
        </Button>
      ) : null}
    </div>
  );
}
