import { useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useLayoutEffect,
  useState,
} from "react";

// A sub-page (a Deck, a Card) swaps the big mobile title for "voltar" plus its own name.
export interface PageHeader {
  backHref: string;
  title: string;
}

const SetPageHeader = createContext<(header: PageHeader | null) => void>(
  () => undefined
);

export function PageHeaderProvider({
  children,
}: {
  children: (header: PageHeader | null) => ReactNode;
}) {
  const [header, setHeader] = useState<PageHeader | null>(null);
  return (
    <SetPageHeader.Provider value={setHeader}>
      {children(header)}
    </SetPageHeader.Provider>
  );
}

export function usePageHeader(title: string, backHref: string) {
  const setHeader = useContext(SetPageHeader);
  useLayoutEffect(() => {
    setHeader({ backHref, title });
    return () => setHeader(null);
  }, [setHeader, title, backHref]);
}

export function MobileBackTitle({ header }: { header: PageHeader }) {
  const router = useRouter();
  const back = useCallback(
    () => router.navigate({ href: header.backHref }),
    [router, header.backHref]
  );
  return (
    <>
      <button
        aria-label="Voltar"
        className="-ml-2 grid size-10 shrink-0 place-items-center rounded-full hover:bg-accent md:hidden"
        onClick={back}
        type="button"
      >
        <ArrowLeft className="size-5" />
      </button>
      <h1 className="min-w-0 flex-1 truncate font-heading font-semibold text-lg md:hidden">
        {header.title}
      </h1>
    </>
  );
}
