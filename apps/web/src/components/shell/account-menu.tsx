import { Link } from "@tanstack/react-router";
import { LogOut, SlidersHorizontal, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

// Name, e-mail and a working "Sair" arrive with auth.
export function AccountMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Conta"
        className="grid size-10 place-items-center rounded-full bg-accent text-accent-foreground"
      >
        <User className="size-[18px]" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem asChild>
          <Link to="/configuracoes">
            <SlidersHorizontal />
            Configurações
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <LogOut />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
