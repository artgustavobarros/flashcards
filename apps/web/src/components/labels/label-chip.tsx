import { Tag, X } from "lucide-react";
import type { MouseEvent } from "react";

// A Label on a Card. With onRemove, an "x" takes it off (the editor); the button carries
// data-label-id so one handler serves every chip.
export function LabelChip({
  id,
  name,
  onRemove,
}: {
  id?: string;
  name: string;
  onRemove?: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1 rounded-full border py-0.5 pl-2.5 font-medium text-xs ${onRemove ? "pr-1" : "pr-2.5"}`}
    >
      <Tag className="size-3 shrink-0 text-muted-foreground" />
      <span className="truncate">{name}</span>
      {onRemove ? (
        <button
          aria-label={`Remover ${name}`}
          className="grid size-4 shrink-0 place-items-center rounded-full hover:bg-accent"
          data-label-id={id}
          onClick={onRemove}
          type="button"
        >
          <X className="size-3" />
        </button>
      ) : null}
    </span>
  );
}
