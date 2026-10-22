import type { CardListItem } from "@daruma/shared";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "@tanstack/react-router";
import { Inbox, Plus, Search } from "lucide-react";
import { type MouseEvent, useCallback, useState } from "react";
import { EmptyState } from "~/components/empty-state";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { type CardFilters, hasFilter, toCardsQuery } from "~/lib/card-filters";
import { rememberOrigin } from "~/lib/card-origin";
import { cardsQuery, decksQuery } from "~/lib/queries";
import { plural } from "~/lib/schedule";
import { CardRow } from "./card-row";
import { CheckBox } from "./check-box";
import { FilterChips } from "./filter-chips";
import { SearchBox } from "./search-box";
import { SelectionBar } from "./selection-bar";

// The Cards tab and the list under a Deck: search, filter chips, the count line (or the
// selection bar) and the rows. Filters live in the URL; on a Deck page deckId fixes the Deck.
export function CardBrowser({
  backLabel,
  deckId,
  filters,
  onFiltersChange,
}: {
  // How the Card page's "voltar" names this list.
  backLabel: string;
  deckId?: string;
  filters: CardFilters;
  onFiltersChange: (filters: CardFilters) => void;
}) {
  const inDeck = Boolean(deckId);
  const query = toCardsQuery(filters, deckId);
  const { data } = useQuery(cardsQuery(query));
  const href = useLocation({ select: (location) => location.href });
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [selecting, setSelecting] = useState(false);

  // A new search or filter drops the selection.
  const change = useCallback(
    (next: CardFilters) => {
      setSelected(new Set());
      onFiltersChange(next);
    },
    [onFiltersChange]
  );
  const patch = useCallback(
    (next: Partial<CardFilters>) => change({ ...filters, ...next }),
    [change, filters]
  );
  const search = useCallback((q?: string) => patch({ q }), [patch]);
  const clear = useCallback(() => change({}), [change]);

  const cards = data?.cards ?? [];
  const term = query.q;
  const filtered = Boolean(term) || hasFilter(filters, inDeck);
  // Only Cards still in the list count as selected.
  const selectedCards = cards.filter((card) => selected.has(card.id));
  const allSelected = cards.length > 0 && selectedCards.length === cards.length;

  const toggle = useCallback((event: MouseEvent<HTMLElement>) => {
    const { cardId } = event.currentTarget.dataset;
    if (cardId) {
      setSelected((current) => {
        const next = new Set(current);
        if (!next.delete(cardId)) {
          next.add(cardId);
        }
        return next;
      });
    }
  }, []);
  const toggleAll = useCallback(
    () =>
      setSelected(
        allSelected ? new Set() : new Set(cards.map((card) => card.id))
      ),
    [allSelected, cards]
  );
  const endSelection = useCallback(() => {
    setSelected(new Set());
    setSelecting(false);
  }, []);
  const startSelecting = useCallback(() => setSelecting(true), []);
  const open = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      const { cardId } = event.currentTarget.dataset;
      if (cardId) {
        rememberOrigin({ cardId, href, label: backLabel });
      }
    },
    [backLabel, href]
  );

  if (data && !cards.length && !filtered && !inDeck) {
    return <NoCards />;
  }

  return (
    <div>
      <div className="space-y-3">
        <SearchBox onSearch={search} value={filters.q} />
        <FilterChips
          filters={filters}
          inDeck={inDeck}
          onChange={patch}
          onClear={clear}
          showClear={filtered}
        />
      </div>
      <div className="mt-3">
        {selectedCards.length ? (
          <SelectionBar
            allSelected={allSelected}
            cards={selectedCards}
            onClear={endSelection}
            onToggleAll={toggleAll}
          />
        ) : (
          <CountLine
            cards={data?.cards}
            onCancel={endSelection}
            onSelect={startSelecting}
            onToggleAll={toggleAll}
            selecting={selecting}
            term={term}
          />
        )}
      </div>
      {data ? null : <Skeleton className="mt-1 h-48 rounded-lg" />}
      {cards.length ? (
        <ul className="mt-1 divide-y overflow-hidden rounded-lg border bg-card shadow-card">
          {cards.map((card) => (
            <CardRow
              card={card}
              key={card.id}
              onOpen={open}
              onToggle={toggle}
              selected={selected.has(card.id)}
              selecting={selecting}
              showCheck={selecting || selectedCards.length > 0}
              showDeck={!inDeck}
              term={term}
              today={data?.today ?? ""}
            />
          ))}
        </ul>
      ) : null}
      {data && !cards.length ? (
        <div className="mt-2">
          <EmptyState
            description={
              term
                ? `Nada com “${term}”${hasFilter(filters, inDeck) ? " com estes filtros" : ""}. Confira a grafia ou tire um filtro.`
                : "Nenhum Card com estes filtros."
            }
            icon={Search}
            title="Nenhum Card encontrado"
          >
            <Button
              className="mt-1"
              onClick={clear}
              size="sm"
              variant="outline"
            >
              Limpar busca e filtros
            </Button>
          </EmptyState>
        </div>
      ) : null}
    </div>
  );
}

// "N cards" (or "N cards com “termo”"), "selecionar todos" on desktop, "Selecionar" on mobile.
function CountLine({
  cards,
  onCancel,
  onSelect,
  onToggleAll,
  selecting,
  term,
}: {
  // undefined while the first result loads.
  cards?: CardListItem[];
  onCancel: () => void;
  onSelect: () => void;
  onToggleAll: () => void;
  selecting: boolean;
  term?: string;
}) {
  let count = cards ? plural(cards.length, "card", "cards") : "";
  if (term && cards) {
    count += ` com “${term}”`;
  }
  return (
    <div className="flex h-11 items-center gap-3 text-muted-foreground text-sm">
      <CheckBox
        aria-label="Selecionar todos"
        checked={false}
        className="hidden md:grid"
        disabled={!cards?.length}
        onClick={onToggleAll}
      />
      <span className="min-w-0 truncate tabular-nums">{count}</span>
      {selecting ? (
        <Button
          className="ml-auto"
          onClick={onCancel}
          size="sm"
          variant="ghost"
        >
          Cancelar
        </Button>
      ) : (
        <Button
          className="ml-auto md:hidden"
          disabled={!cards?.length}
          onClick={onSelect}
          size="sm"
          variant="ghost"
        >
          Selecionar
        </Button>
      )}
    </div>
  );
}

// The Cards tab with no Card at all.
function NoCards() {
  const hasDecks = Boolean(useQuery(decksQuery).data?.decks.length);
  return (
    <EmptyState
      description={
        hasDecks
          ? "Escolha um Deck e escreva os primeiros Cards."
          : "Crie um Deck para começar a escrever Cards."
      }
      icon={Inbox}
      title="Nenhum Card ainda"
    >
      <Button asChild className="mt-1">
        {hasDecks ? (
          <Link to="/decks">Ver Decks</Link>
        ) : (
          <Link to="/decks/novo">
            <Plus data-icon="inline-start" />
            Novo Deck
          </Link>
        )}
      </Button>
    </EmptyState>
  );
}
