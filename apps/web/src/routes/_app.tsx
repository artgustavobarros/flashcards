import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppShell } from "~/components/shell/app-shell";
import { loginRedirect, sessionQuery } from "~/lib/auth";

// Every logged-in page lives inside the shell. No session: the login page, which comes back here.
export const Route = createFileRoute("/_app")({
  beforeLoad: async ({ context, location }) => {
    const session = await context.queryClient.ensureQueryData(sessionQuery);
    if (!session) {
      throw redirect(loginRedirect(location.href));
    }
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
