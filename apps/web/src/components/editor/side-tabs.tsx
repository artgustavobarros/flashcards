import { cn } from "cn";
import { type MouseEvent, useCallback } from "react";
import type { Side } from "./card-editor";

const SIDES: { label: string; side: Side }[] = [
  { label: "Pergunta", side: "question" },
  { label: "Resposta", side: "answer" },
];

function dotColor(error: boolean, filled: boolean) {
  if (error) {
    return "bg-destructive";
  }
  return filled ? "bg-primary" : "bg-input";
}

// "Pergunta | Resposta" on top of the Card. The dot says whether that side has content.
export function SideTabs({
  errors,
  filled,
  onChange,
  side,
}: {
  errors: Partial<Record<Side, string>>;
  filled: Record<Side, boolean>;
  onChange: (side: Side) => void;
  side: Side;
}) {
  const pick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) =>
      onChange(event.currentTarget.dataset.side as Side),
    [onChange]
  );

  return (
    <div
      className="inline-flex rounded-full bg-muted p-1 text-sm"
      role="tablist"
    >
      {SIDES.map((tab) => (
        <button
          aria-selected={tab.side === side}
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-4 py-1.5",
            tab.side === side
              ? "bg-card font-medium shadow-card"
              : "text-muted-foreground"
          )}
          data-side={tab.side}
          key={tab.side}
          onClick={pick}
          role="tab"
          type="button"
        >
          {tab.label}
          <span
            className={cn(
              "size-1.5 rounded-full",
              dotColor(!!errors[tab.side], filled[tab.side])
            )}
          />
        </button>
      ))}
    </div>
  );
}
