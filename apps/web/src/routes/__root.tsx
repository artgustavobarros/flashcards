import { type QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { AppToaster } from "~/components/app-toaster";
import { ErrorPage } from "~/components/error-page";
import { NotFound } from "~/components/not-found";
import styles from "~/styles.css?url";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
    component: RootComponent,
    errorComponent: ErrorPage,
    head: () => ({
      links: [
        { href: styles, rel: "stylesheet" },
        { href: "/favicon.svg", rel: "icon", type: "image/svg+xml" },
      ],
      meta: [
        { charSet: "utf-8" },
        {
          content: "width=device-width, initial-scale=1, viewport-fit=cover",
          name: "viewport",
        },
        { title: "Daruma" },
      ],
    }),
    notFoundComponent: NotFound,
    shellComponent: RootDocument,
  }
);

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {/* In the shell, not RootComponent: the root errorComponent replaces RootComponent,
            and the error page still needs the theme and toasts. */}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          disableTransitionOnChange
          enableSystem
        >
          {children}
          <AppToaster />
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  );
}
