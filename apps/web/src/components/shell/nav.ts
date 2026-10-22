import { ChartColumn, House, Layers, SlidersHorizontal } from "lucide-react";

export const NAV = [
  { to: "/", label: "Início", icon: House, exact: true },
  { to: "/decks", label: "Decks", icon: Layers, exact: false },
  { to: "/progresso", label: "Progresso", icon: ChartColumn, exact: false },
  {
    to: "/configuracoes",
    label: "Configurações",
    icon: SlidersHorizontal,
    exact: false,
  },
] as const;
