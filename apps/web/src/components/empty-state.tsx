import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

// With a description, the title reads as a heading above it (prototype/decks.html).
export function EmptyState({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-14 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-6" />
      </span>
      {description ? (
        <div className="space-y-1">
          <p className="font-medium">{title}</p>
          <p className="max-w-sm text-muted-foreground text-sm">
            {description}
          </p>
        </div>
      ) : (
        <p className="max-w-xs text-muted-foreground text-sm">{title}</p>
      )}
      {children}
    </div>
  );
}
