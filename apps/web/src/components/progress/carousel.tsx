import { cn } from "cn";
import {
  Children,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

const DRAG_SLOP = 5;
const SWIPE = 40;

// The distance from one block to the next.
const stepOf = (el: HTMLElement) => {
  const [first, second] = el.children as unknown as HTMLElement[];
  return first && second
    ? second.offsetLeft - first.offsetLeft
    : el.clientWidth;
};

// Mobile: one block at a time across the full width, snapping, with dots in the title that show
// the position and jump to a block. Drags with the mouse too. Its height follows the block in
// view, so a short block doesn't leave space under it.
export function Carousel({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  const items = Children.toArray(children);
  const count = items.length;
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const drag = useRef<{ left: number; moved: boolean; x: number } | null>(null);
  const dragging = useRef(false);

  const fit = useCallback(() => {
    const el = track.current;
    if (!el) {
      return;
    }
    const position = el.scrollLeft / stepOf(el);
    const i = Math.floor(position);
    const height = (k: number) =>
      (el.children[Math.min(k, el.children.length - 1)] as HTMLElement)
        .offsetHeight;
    el.style.height = `${height(i) + (height(i + 1) - height(i)) * (position - i) + 8}px`;
    setActive(Math.round(position));
  }, []);

  useEffect(() => {
    const el = track.current;
    if (!el) {
      return;
    }
    const observer = new ResizeObserver(fit);
    for (const child of el.children) {
      observer.observe(child);
    }
    return () => observer.disconnect();
  }, [fit]);

  const go = useCallback((i: number) => {
    const el = track.current;
    el?.scrollTo({ behavior: "smooth", left: i * stepOf(el) });
  }, []);

  const goToDot = useCallback(
    (event: MouseEvent<HTMLButtonElement>) =>
      go(Number(event.currentTarget.dataset.index)),
    [go]
  );

  const grab = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const el = track.current;
    if (event.pointerType !== "mouse" || event.button !== 0 || !el) {
      return;
    }
    drag.current = { left: el.scrollLeft, moved: false, x: event.clientX };
    dragging.current = true;
    el.style.scrollSnapType = "none";
    el.style.cursor = "grabbing";
  }, []);

  const move = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const el = track.current;
    if (!(drag.current && el && dragging.current)) {
      return;
    }
    const dx = event.clientX - drag.current.x;
    if (Math.abs(dx) > DRAG_SLOP) {
      drag.current.moved = true;
    }
    el.scrollLeft = drag.current.left - dx;
  }, []);

  // Lets go of a mouse drag: snaps to the nearest block, or to the next one after a swipe.
  const release = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const el = track.current;
      const start = drag.current;
      if (!(start && el && dragging.current)) {
        return;
      }
      dragging.current = false;
      el.style.cursor = "";
      const dx = event.clientX - start.x;
      let i = Math.round(start.left / stepOf(el));
      if (dx < -SWIPE) {
        i += 1;
      } else if (dx > SWIPE) {
        i -= 1;
      }
      go(Math.max(0, Math.min(count - 1, i)));
      setTimeout(() => {
        el.style.scrollSnapType = "";
      }, 450);
      if (!start.moved) {
        drag.current = null;
      }
    },
    [count, go]
  );

  // After a drag, the click neither opens a tooltip nor presses a button.
  const swallowClick = useCallback((event: MouseEvent<HTMLDivElement>) => {
    if (drag.current?.moved) {
      event.stopPropagation();
      event.preventDefault();
    }
    drag.current = null;
  }, []);

  return (
    <section>
      <div className="mb-2.5 flex items-center justify-between">
        <h2 className="font-heading font-semibold text-base">{title}</h2>
        <div className="flex items-center gap-1.5">
          {items.map((_, i) => (
            <button
              aria-current={i === active}
              aria-label={`Ir para o ${i + 1}º`}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === active
                  ? "w-4 bg-foreground"
                  : "w-1.5 bg-muted-foreground/40"
              )}
              data-index={i}
              // biome-ignore lint/suspicious/noArrayIndexKey: one dot per block.
              key={i}
              onClick={goToDot}
              type="button"
            />
          ))}
        </div>
      </div>
      <div
        className="-mx-5 flex cursor-grab snap-x snap-mandatory scroll-px-5 items-start gap-5 overflow-x-auto overflow-y-hidden px-5 pb-2 [scrollbar-width:none]"
        onClickCapture={swallowClick}
        onPointerDown={grab}
        onPointerLeave={release}
        onPointerMove={move}
        onPointerUp={release}
        onScroll={fit}
        ref={track}
      >
        {items.map((item, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: blocks keep their order.
          <div className="w-full shrink-0 snap-start" key={i}>
            {item}
          </div>
        ))}
      </div>
    </section>
  );
}
