import { Search, X } from "lucide-react";
import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

// Typing filters the list after this pause.
const SEARCH_DELAY_MS = 200;

// The search field above a list. It shows what is typed right away and reports it after a
// pause; a different value from outside (back, "Limpar") replaces the text.
export function SearchBox({
  onSearch,
  value,
}: {
  onSearch: (q: string | undefined) => void;
  value?: string;
}) {
  const [text, setText] = useState(value ?? "");
  // The last value reported, to tell outside changes from our own.
  const reported = useRef(value);

  useEffect(() => {
    if (value !== reported.current) {
      reported.current = value;
      setText(value ?? "");
    }
  }, [value]);

  useEffect(() => {
    if (text === (value ?? "")) {
      return;
    }
    const timer = setTimeout(() => {
      reported.current = text || undefined;
      onSearch(reported.current);
    }, SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [onSearch, text, value]);

  const onChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => setText(event.target.value),
    []
  );
  const clear = useCallback(() => setText(""), []);

  return (
    <label className="relative block">
      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        aria-label="Buscar Cards"
        className="h-11 w-full rounded-full border border-input bg-background pr-10 pl-10 text-base outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring md:h-10 md:text-sm [&::-webkit-search-cancel-button]:hidden"
        onChange={onChange}
        placeholder="Buscar na pergunta, na resposta e nos Comments"
        type="search"
        value={text}
      />
      {text ? (
        <button
          aria-label="Limpar busca"
          className="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-accent"
          onClick={clear}
          type="button"
        >
          <X className="size-4" />
        </button>
      ) : null}
    </label>
  );
}
