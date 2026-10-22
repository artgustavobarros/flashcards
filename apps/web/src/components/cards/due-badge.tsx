import type { CardListItem } from "@daruma/shared";
import { cn } from "cn";
import { type DueTone, dueBadge } from "~/lib/schedule";

const TONE: Record<DueTone, string> = {
  late: "bg-destructive/10 text-destructive",
  new: "bg-primary/10 text-primary",
  today: "bg-warning/15 text-warning",
};

export function DueBadge({
  card,
  today,
}: {
  card: Pick<CardListItem, "due" | "state">;
  today: string;
}) {
  const badge = dueBadge(card, today);
  if (!badge) {
    return null;
  }
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 font-medium text-xs",
        TONE[badge.tone]
      )}
    >
      {badge.label}
    </span>
  );
}
