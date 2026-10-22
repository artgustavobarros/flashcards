import { useQueryClient } from "@tanstack/react-query";
import {
  createFileRoute,
  Link,
  redirect,
  useRouter,
} from "@tanstack/react-router";
import { CircleAlert, Info, LoaderCircle, TerminalSquare } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { DarumaLogo } from "~/components/daruma-mark";
import { GoogleIcon } from "~/components/google-icon";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { authClient, safeRedirect, sessionQuery } from "~/lib/auth";
import { routeTitle } from "~/lib/route-title";

// Which sign-in is in flight; both buttons stay disabled meanwhile.
type PendingSignIn = "google" | "dev" | null;

const DEV_EMAIL = "dev@daruma.local";

const searchSchema = z.object({
  // Better Auth appends ?error= when the Google sign-in fails.
  error: z.string().optional().catch(undefined),
  // Set by the 401 handler in router.tsx.
  expired: z.boolean().optional().catch(undefined),
  redirect: z.string().optional().catch(undefined),
});

export const Route = createFileRoute("/entrar")({
  beforeLoad: async ({ context, search }) => {
    const session = await context.queryClient.ensureQueryData(sessionQuery);
    if (session) {
      throw redirect({ href: safeRedirect(search.redirect) });
    }
  },
  component: Login,
  head: () => ({ meta: [{ title: "Entrar · Daruma" }] }),
  validateSearch: searchSchema,
});

function Login() {
  const search = Route.useSearch();
  const target = safeRedirect(search.redirect);
  const [pending, setPending] = useState<PendingSignIn>(null);
  const [googleFailed, setGoogleFailed] = useState(Boolean(search.error));

  const signInWithGoogle = useCallback(async () => {
    setPending("google");
    setGoogleFailed(false);
    const { error } = await authClient.signIn.social({
      callbackURL: target,
      errorCallbackURL: `/entrar?redirect=${encodeURIComponent(target)}`,
      // A brand-new account starts on the empty Início, wherever the sign-in began.
      newUserCallbackURL: "/",
      provider: "google",
    });
    // On success the browser is already on its way to Google.
    if (error) {
      setPending(null);
      setGoogleFailed(true);
    }
  }, [target]);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="px-5 py-5 md:px-10">
        <DarumaLogo />
      </header>
      <main className="flex flex-1 justify-center px-5 pt-6 pb-28 md:items-center md:pt-0">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-1.5">
            <h1 className="font-heading font-semibold text-3xl tracking-tight">
              Entre no Daruma
            </h1>
            <p className="text-muted-foreground">
              Use sua conta Google. Na primeira vez, sua conta no Daruma é
              criada na hora.
            </p>
          </div>

          {googleFailed ? (
            <Alert className="gap-x-3 border-destructive/40 bg-destructive/5 p-4 *:[svg]:size-5">
              <CircleAlert />
              <AlertTitle>Não foi possível entrar com o Google</AlertTitle>
              <AlertDescription>
                Tente de novo em alguns instantes.
              </AlertDescription>
            </Alert>
          ) : null}
          {search.expired && !googleFailed ? (
            <SessionExpired target={target} />
          ) : null}

          <Button
            className="w-full"
            disabled={pending !== null}
            onClick={signInWithGoogle}
            size="lg"
            variant="outline"
          >
            {pending === "google" ? (
              <>
                <LoaderCircle className="animate-spin" />
                Abrindo o Google…
              </>
            ) : (
              <>
                <GoogleIcon />
                Continuar com Google
              </>
            )}
          </Button>

          <p className="text-muted-foreground text-xs">
            Ao continuar, você aceita os{" "}
            <Link
              className="underline underline-offset-2 hover:text-foreground"
              hash="termos"
              to="/privacidade"
            >
              Termos
            </Link>{" "}
            e a{" "}
            <Link
              className="underline underline-offset-2 hover:text-foreground"
              hash="privacidade"
              to="/privacidade"
            >
              Política de privacidade
            </Link>
            .
          </p>

          {import.meta.env.DEV ? (
            <DevLogin
              disabled={pending !== null}
              onPendingChange={setPending}
              target={target}
            />
          ) : null}
        </div>
      </main>
    </div>
  );
}

const PATH_END = /[?#]/;

// "voltar a “Decks”" when the page has a title, a generic line otherwise.
function SessionExpired({ target }: { target: string }) {
  const router = useRouter();
  const pathname = target.split(PATH_END)[0] ?? "/";
  const title = routeTitle(router.matchRoutes(pathname));

  return (
    <Alert className="gap-x-3 bg-muted/50 p-4 *:[svg]:size-5 *:[svg]:text-muted-foreground">
      <Info />
      <AlertDescription className="text-foreground">
        {title
          ? `Sua sessão expirou. Entre de novo para voltar a “${title}”.`
          : "Sua sessão expirou. Entre de novo para continuar."}
      </AlertDescription>
    </Alert>
  );
}

// Dev builds only. The API refuses it unless DEV_LOGIN=true, and never in production.
function DevLogin({
  disabled,
  onPendingChange,
  target,
}: {
  disabled: boolean;
  onPendingChange: (pending: PendingSignIn) => void;
  target: string;
}) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const signIn = useCallback(async () => {
    onPendingChange("dev");
    const { data, error } = await authClient.$fetch<{ isNewUser: boolean }>(
      "/dev-login/sign-in",
      {
        body: { email: DEV_EMAIL, name: "Dev" },
        method: "POST",
      }
    );
    if (error) {
      onPendingChange(null);
      toast.error("Login de dev desligado", {
        description: "Ponha DEV_LOGIN=true em apps/api/.env.",
      });
      return;
    }
    // Same rule as sign-out and a 401: nothing cached survives an account change.
    queryClient.clear();
    await router.navigate({ href: data.isNewUser ? "/" : target });
  }, [onPendingChange, queryClient, router, target]);

  return (
    <div className="space-y-2 border-t border-dashed pt-6">
      <Button
        className="w-full"
        disabled={disabled}
        onClick={signIn}
        variant="ghost"
      >
        <TerminalSquare />
        Entrar como dev
      </Button>
      <p className="text-center text-muted-foreground text-xs">
        Só em desenvolvimento: entra como {DEV_EMAIL}, sem Google.
      </p>
    </div>
  );
}
