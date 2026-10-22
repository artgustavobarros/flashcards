import { queryOptions } from "@tanstack/react-query";
import { createAuthClient } from "better-auth/react";

// Same origin as the API, so the session cookie rides along on every /api call.
export const authClient = createAuthClient({ basePath: "/api/auth" });

// null when signed out. Every sign-in, sign-out and 401 clears the whole QueryClient.
export const sessionQuery = queryOptions({
  queryFn: async () => {
    const { data, error } = await authClient.getSession();
    if (error) {
      throw new Error(error.message ?? "Não foi possível ler a sessão.");
    }
    return data;
  },
  queryKey: ["session"],
  staleTime: 5 * 60 * 1000,
});

// The login page, which sends the person back to `href` afterwards. `expired` adds the
// "Sua sessão expirou" alert.
export function loginRedirect(href: string, { expired = false } = {}) {
  return {
    search: {
      expired: expired || undefined,
      redirect: href === "/" ? undefined : href,
    },
    to: "/entrar" as const,
  };
}

// Only same-app paths, so ?redirect= cannot send someone to another site.
export function safeRedirect(path: string | undefined) {
  return path?.startsWith("/") && !path.startsWith("//") ? path : "/";
}
