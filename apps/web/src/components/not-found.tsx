import { Link } from "@tanstack/react-router";
import { AppShell } from "~/components/shell/app-shell";
import { Button } from "~/components/ui/button";

// Logged-in 404, inside the shell. The logged-out one (logo and "Entrar") comes with auth.
export function NotFound() {
  return (
    <AppShell>
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="font-heading font-semibold text-7xl text-primary">404</p>
        <h2 className="font-heading font-semibold text-xl">
          Página não encontrada
        </h2>
        <p className="max-w-sm text-muted-foreground text-sm">
          O endereço pode estar errado ou a página saiu do ar.
        </p>
        <Button asChild>
          <Link to="/">Ir para o Início</Link>
        </Button>
      </div>
    </AppShell>
  );
}
