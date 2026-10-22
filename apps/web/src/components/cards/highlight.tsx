import { foldText } from "@daruma/shared";

// Where the search term is in a text, ignoring accents and case. -1 if it isn't, or if folding
// changed the text's length (then indexes wouldn't line up).
function find(text: string, term: string, from = 0) {
  const folded = foldText(text);
  return folded.length === text.length
    ? folded.indexOf(foldText(term), from)
    : -1;
}

export const hasTerm = (text: string, term: string) =>
  foldText(text).includes(foldText(term));

// The text with every match of the term marked in light amber.
export function Highlight({ term, text }: { term?: string; text: string }) {
  const needle = term?.trim();
  if (!needle) {
    return text;
  }
  const parts: React.ReactNode[] = [];
  let at = 0;
  for (
    let index = find(text, needle);
    index >= 0;
    index = find(text, needle, at)
  ) {
    parts.push(
      text.slice(at, index),
      <mark
        className="rounded-[4px] bg-warning/20 px-[0.1em] text-inherit"
        key={index}
      >
        {text.slice(index, index + needle.length)}
      </mark>
    );
    at = index + needle.length;
  }
  parts.push(text.slice(at));
  return parts;
}

// A short window of the text around the first match, for "na resposta:" and "num Comment:".
export function snippet(text: string, term: string) {
  const flat = text.replace(/\s+/g, " ");
  const index = find(flat, term.trim());
  if (index < 0) {
    return flat;
  }
  const start = Math.max(0, index - 14);
  const end = Math.min(flat.length, index + term.length + 60);
  return `${start ? "…" : ""}${flat.slice(start, end)}${end < flat.length ? "…" : ""}`;
}
