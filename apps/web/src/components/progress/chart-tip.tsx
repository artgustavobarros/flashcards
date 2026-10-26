import {
  createContext,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

interface Tip {
  content: ReactNode;
  x: number;
  y: number;
}

const TipContext = createContext<(tip: Tip | null) => void>(() => undefined);

const GAP = 12;
const EDGE = 8;

// One tooltip for every chart on the page: follows the pointer on desktop, opens on tap on a
// phone. Placed above the pointer, or below it near the top of the window.
export function ChartTips({ children }: { children: ReactNode }) {
  const [tip, setTip] = useState<Tip | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!(el && tip)) {
      return;
    }
    const { height, width } = el.getBoundingClientRect();
    const left = Math.max(
      EDGE,
      Math.min(window.innerWidth - width - EDGE, tip.x - width / 2)
    );
    const top =
      tip.y - height - GAP < EDGE ? tip.y + GAP + 4 : tip.y - height - GAP;
    el.style.transform = `translate(${left}px, ${top}px)`;
  }, [tip]);

  // Scrolling, or a tap outside the marks, closes it.
  useEffect(() => {
    if (!tip) {
      return;
    }
    const hide = () => setTip(null);
    const tapOutside = (event: Event) => {
      if (!(event.target as Element).closest("[data-tip]")) {
        hide();
      }
    };
    window.addEventListener("scroll", hide, { capture: true, passive: true });
    document.addEventListener("click", tapOutside);
    return () => {
      window.removeEventListener("scroll", hide, { capture: true });
      document.removeEventListener("click", tapOutside);
    };
  }, [tip]);

  return (
    <TipContext.Provider value={setTip}>
      {children}
      {tip ? (
        <div
          className="pointer-events-none fixed top-0 left-0 z-50 max-w-64 rounded-md border bg-popover px-3 py-2 text-popover-foreground text-xs shadow-pop"
          ref={ref}
          role="tooltip"
        >
          {tip.content}
        </div>
      ) : null}
    </TipContext.Provider>
  );
}

// Spread on a chart mark: shows title and text in the tooltip, and names the mark for screen
// readers.
export function useTip() {
  const setTip = useContext(TipContext);
  return useCallback(
    (title: string, text: string) => {
      const content = (
        <>
          <p className="font-medium">{title}</p>
          <p className="mt-0.5 text-muted-foreground tabular-nums">{text}</p>
        </>
      );
      return {
        "aria-label": `${title}: ${text}`,
        "data-tip": "",
        onClick: (event: MouseEvent<HTMLElement>) => {
          const rect = event.currentTarget.getBoundingClientRect();
          setTip({ content, x: rect.left + rect.width / 2, y: rect.top });
        },
        onPointerLeave: (event: PointerEvent<HTMLElement>) => {
          if (event.pointerType === "mouse") {
            setTip(null);
          }
        },
        onPointerMove: (event: PointerEvent<HTMLElement>) => {
          if (event.pointerType === "mouse") {
            setTip({ content, x: event.clientX, y: event.clientY });
          }
        },
        role: "img",
      };
    },
    [setTip]
  );
}
