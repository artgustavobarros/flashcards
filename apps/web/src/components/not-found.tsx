import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { DarumaLogo } from "~/components/daruma-mark";
import { AppShell } from "~/components/shell/app-shell";
import { Button } from "~/components/ui/button";
import { sessionQuery } from "~/lib/auth";

// Inside the shell when signed in; logo and "Entrar" when not.
export function NotFound() {
  const { data: session, status } = useQuery(sessionQuery);

  if (status === "pending") {
    return null;
  }
  if (!session) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-5 text-center">
        <DarumaLogo className="mb-6" />
        <Message />
        <Button asChild>
          <Link to="/entrar">Entrar</Link>
        </Button>
      </main>
    );
  }
  return (
    <AppShell>
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <Message />
        <Button asChild>
          <Link to="/">Ir para o Início</Link>
        </Button>
      </div>
    </AppShell>
  );
}

function Message() {
  return (
    <>
      <p className="font-heading font-semibold text-7xl text-primary">404</p>
      <h2 className="font-heading font-semibold text-xl">
        Página não encontrada
      </h2>
      <p className="max-w-sm text-muted-foreground text-sm">
        O endereço pode estar errado ou a página saiu do ar.
      </p>
    </>
  );
}
