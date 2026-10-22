import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { ApiError } from "~/lib/api";
import { loginRedirect } from "~/lib/auth";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  // A 401 means the session ended under us: back to the login, then back here.
  const onError = (error: Error) => {
    if (!(error instanceof ApiError && error.status === 401)) {
      return;
    }
    // Same rule as sign-in and sign-out: nothing cached survives an account change.
    queryClient.clear();
    const { href, pathname } = router.state.location;
    if (pathname !== "/entrar") {
      router.navigate(loginRedirect(href, { expired: true }));
    }
  };
  const queryClient = new QueryClient({
    mutationCache: new MutationCache({ onError }),
    queryCache: new QueryCache({ onError }),
  });

  const router = createRouter({
    context: { queryClient },
    routeTree,
    scrollRestoration: true,
  });
  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
  interface StaticDataRouteOption {
    // A whole page without the shell: no header, nav or tab bar (the Card editor).
    focus?: boolean;
    // No "+ Novo" pill on mobile (the Card page).
    hideNew?: boolean;
    // Shown as the big header title on mobile.
    title?: string;
  }
}
