import type { CardListItem } from "@daruma/shared";
import { Link } from "@tanstack/react-router";
import { cn } from "cn";
import { MessageSquare } from "lucide-react";
import { type MouseEvent, memo } from "react";
import { LabelChip } from "~/components/labels/label-chip";
import { CheckBox } from "./check-box";
import { DueBadge } from "./due-badge";
import { Highlight, hasTerm, snippet } from "./highlight";

// The second line: the answer, or the bit of the answer or Comment where the term is.
function secondLine(
  card: CardListItem,
  term?: string
): { note?: string; text: string } {
  if (term && card.matchedComment) {
    return { note: "num Comment", text: snippet(card.matchedComment, term) };
  }
  if (term && !hasTerm(card.questionText, term)) {
    return { note: "na resposta", text: snippet(card.answerText, term) };
  }
  return { text: card.answerText.replace(/\s+/g, " ") };
}

// One Card in a list. Selecting (the mobile "Selecionar"), tapping the row marks it instead of
// opening it. Handlers read the Card's id from data-card-id.
function CardRowView({
  card,
  onOpen,
  onToggle,
  selected,
  selecting,
  showCheck,
  showDeck,
  term,
  today,
}: {
  card: CardListItem;
  onOpen: (event: MouseEvent<HTMLAnchorElement>) => void;
  onToggle: (event: MouseEvent<HTMLButtonElement>) => void;
  selected: boolean;
  selecting: boolean;
  showCheck: boolean;
  showDeck: boolean;
  term?: string;
  today: string;
}) {
  const second = secondLine(card, term);
  const body = (
    <>
      <p className="line-clamp-2 font-medium text-sm">
        <Highlight term={term} text={card.questionText} />
      </p>
      <p className="mt-0.5 line-clamp-1 text-muted-foreground text-sm">
        {second.note ? (
          <span className="font-medium">{second.note}: </span>
        ) : null}
        <Highlight term={term} text={second.text} />
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5 empty:hidden">
        <DueBadge card={card} today={today} />
        {card.labels.map((label) => (
          <LabelChip key={label.id} name={label.name} />
        ))}
        {showDeck ? (
          <span className="text-muted-foreground text-xs">{card.deckName}</span>
        ) : null}
        {card.commentCount ? (
          <span className="inline-flex items-center gap-1 text-muted-foreground text-xs tabular-nums">
            <MessageSquare className="size-3.5" />
            {card.commentCount}
          </span>
        ) : null}
      </div>
    </>
  );

  return (
    <li
      className={cn(
        "flex items-start gap-3 px-4 py-3.5 transition",
        selected ? "bg-primary/5" : "hover:bg-accent/50"
      )}
    >
      <CheckBox
        aria-label="Selecionar Card"
        checked={selected}
        className={cn("mt-0.5", !showCheck && "hidden md:grid")}
        data-card-id={card.id}
        onClick={onToggle}
      />
      {selecting ? (
        <button
          className="min-w-0 flex-1 text-left"
          data-card-id={card.id}
          onClick={onToggle}
          type="button"
        >
          {body}
        </button>
      ) : (
        <Link
          className="min-w-0 flex-1"
          data-card-id={card.id}
          onClick={onOpen}
          params={{ cardId: card.id }}
          to="/decks/cards/$cardId"
        >
          {body}
        </Link>
      )}
    </li>
  );
}

export const CardRow = memo(CardRowView);
