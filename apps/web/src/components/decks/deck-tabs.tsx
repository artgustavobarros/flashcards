import { Link } from "@tanstack/react-router";
import { cn } from "cn";

const TABS = [
  { label: "Decks", to: "/decks" },
  { label: "Cards", to: "/decks/cards" },
] as const;

// "Decks · Cards" at the top of the section.
export function DeckTabs({ className }: { className?: string }) {
  return (
    <nav
      aria-label="Decks e Cards"
      className={cn("inline-flex rounded-full bg-muted p-1", className)}
    >
      {TABS.map((tab) => (
        <Link
          activeOptions={{ exact: true, includeSearch: false }}
          className="h-8 rounded-full px-5 text-muted-foreground text-sm leading-8 transition hover:text-foreground data-[status=active]:bg-card data-[status=active]:font-medium data-[status=active]:text-foreground data-[status=active]:shadow-card"
          key={tab.to}
          to={tab.to}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
