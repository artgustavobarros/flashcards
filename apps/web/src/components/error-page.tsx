import {
  type ErrorComponentProps,
  Link,
  useRouter,
} from "@tanstack/react-router";
import { RefreshCw } from "lucide-react";
import { useCallback } from "react";
import { DarumaLogo } from "~/components/daruma-mark";
import { Button } from "~/components/ui/button";

// Generic error, outside the shell: the shell itself may be what broke.
export function ErrorPage({ reset }: ErrorComponentProps) {
  const router = useRouter();
  const retry = useCallback(() => {
    reset();
    router.invalidate();
  }, [reset, router]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-5 text-center">
      <DarumaLogo className="mb-6" />
      <h1 className="font-heading font-semibold text-2xl">Algo deu errado</h1>
      <p className="text-muted-foreground text-sm">
        Não conseguimos carregar esta página. Tente de novo em instantes.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <Button onClick={retry}>
          <RefreshCw data-icon="inline-start" />
          Tentar de novo
        </Button>
        <Button asChild variant="outline">
          <Link to="/">Ir para o Início</Link>
        </Button>
      </div>
    </main>
  );
}
