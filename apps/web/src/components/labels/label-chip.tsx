import { Tag } from "lucide-react";

export function LabelChip({ name }: { name: string }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1 rounded-full border px-2.5 py-0.5 font-medium text-xs">
      <Tag className="size-3 shrink-0 text-muted-foreground" />
      <span className="truncate">{name}</span>
    </span>
  );
}
