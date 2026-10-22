import { type QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { ErrorPage } from "~/components/error-page";
import { NotFound } from "~/components/not-found";
import { Toaster } from "~/components/ui/sonner";
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
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        disableTransitionOnChange
        enableSystem
      >
        <Outlet />
        {/* Mobile: above the tab bar and the "+ Novo" pill. */}
        <Toaster
          duration={5000}
          mobileOffset={{ bottom: 152 }}
          position="bottom-right"
        />
      </ThemeProvider>
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
        {children}
        <Scripts />
      </body>
    </html>
  );
}
