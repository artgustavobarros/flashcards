import { ChartColumn, House, Layers, SlidersHorizontal } from "lucide-react";

export const NAV = [
  { to: "/", label: "Início", icon: House },
  { to: "/decks", label: "Decks", icon: Layers },
  { to: "/progresso", label: "Progresso", icon: ChartColumn },
  { to: "/configuracoes", label: "Configurações", icon: SlidersHorizontal },
] as const;
