// Accent-blind, case-blind form of a text, for matching: "Músculo" and "musculo" are equal.
// On NFC text (what browsers type) letters keep their length, so a match's index in the folded
// text usually points at the same place in the original. Callers check the lengths first.
export const foldText = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .normalize("NFC")
    .toLowerCase();
