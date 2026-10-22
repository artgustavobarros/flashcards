import { Link, useMatches } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { DarumaLogo } from "~/components/daruma-mark";
import { routeTitle } from "~/lib/route-title";
import { AccountMenu } from "./account-menu";
import { BellMenu } from "./bell-menu";
import { NAV } from "./nav";
import { NewMenu, NewSheet } from "./new-menu";
import {
  MobileBackTitle,
  type PageHeader,
  PageHeaderProvider,
} from "./page-header";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <PageHeaderProvider>
      {(header) => <Shell header={header}>{children}</Shell>}
    </PageHeaderProvider>
  );
}

// Mobile shows the page title in the header, so each route sets staticData.title, or a sub-page
// calls usePageHeader.
function Shell({
  children,
  header,
}: {
  children: ReactNode;
  header: PageHeader | null;
}) {
  const matches = useMatches();
  const title = routeTitle(matches) ?? "Daruma";
  const hideNew = matches.some((match) => match.staticData.hideNew);
  if (matches.some((match) => match.staticData.focus)) {
    return children;
  }

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-4 px-5 md:h-20 md:px-6">
          {header ? (
            <MobileBackTitle header={header} />
          ) : (
            <h1 className="truncate font-heading font-semibold text-2xl md:hidden">
              {title}
            </h1>
          )}
          <Link className="hidden md:inline-flex" to="/">
            <DarumaLogo />
          </Link>
          <nav
            aria-label="Principal"
            className="mx-auto hidden items-center rounded-full bg-muted p-1 text-sm md:flex"
          >
            {NAV.map((item) => (
              <Link
                activeOptions={{ exact: item.exact }}
                className="rounded-full px-4 py-1.5 text-muted-foreground transition hover:text-foreground data-[status=active]:bg-card data-[status=active]:font-medium data-[status=active]:text-foreground data-[status=active]:shadow-card"
                key={item.to}
                to={item.to}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <div className="hidden md:block">
              <NewMenu />
            </div>
            <BellMenu />
            {/* On mobile too, unlike the prototype: it is the only way to see the account and sign out. */}
            <AccountMenu />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 pt-4 pb-36 md:px-6 md:pt-8 md:pb-16">
        {children}
      </main>

      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-30 bg-card pb-[env(safe-area-inset-bottom)] shadow-[0_-1px_0_var(--border)] md:hidden"
      >
        <div className="grid grid-cols-4 pt-2 pb-1">
          {NAV.map((item) => (
            <Link
              activeOptions={{ exact: item.exact }}
              className="group flex flex-col items-center gap-1 font-medium text-[11px] text-muted-foreground data-[status=active]:text-foreground"
              key={item.to}
              to={item.to}
            >
              <span className="grid h-8 w-14 place-items-center rounded-full group-data-[status=active]:bg-primary/15 group-data-[status=active]:text-primary">
                <item.icon className="size-5" />
              </span>
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
      {hideNew ? null : <NewSheet />}
    </div>
  );
}
