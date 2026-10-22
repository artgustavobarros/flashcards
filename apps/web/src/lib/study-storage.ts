import type { Card, StudyQueueBody } from "@daruma/shared";
import type { StudySession } from "./study-session";

const SESSION_KEY = "daruma:study-session";
const BATCH_KEY = "daruma:study-batch";
const SAVED_KEY = "daruma:study-saved";

export interface StoredStudy {
  cards: Card[];
  scope: StudyQueueBody;
  session: StudySession;
  today: string;
}

export function readStudy(): StoredStudy | null {
  if (typeof sessionStorage === "undefined") {
    return null;
  }
  try {
    return JSON.parse(
      sessionStorage.getItem(SESSION_KEY) ?? "null"
    ) as StoredStudy | null;
  } catch {
    return null;
  }
}

export function writeStudy(study: StoredStudy) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(study));
}

export function clearStudy() {
  sessionStorage.removeItem(SESSION_KEY);
}

export function setStudyBatch(cardIds: string[]) {
  sessionStorage.setItem(BATCH_KEY, JSON.stringify(cardIds));
}

export function studyScope(
  origin: "daily" | "deck" | "batch",
  deckId?: string
): StudyQueueBody | null {
  if (origin === "daily") {
    return { origin };
  }
  if (origin === "deck") {
    return deckId ? { deckId, origin } : null;
  }
  if (typeof sessionStorage === "undefined") {
    return null;
  }
  const stored = readStudy();
  if (stored?.scope.origin === "batch") {
    return stored.scope;
  }
  try {
    const cardIds = JSON.parse(sessionStorage.getItem(BATCH_KEY) ?? "null") as
      | string[]
      | null;
    return cardIds?.length ? { cardIds, origin } : null;
  } catch {
    return null;
  }
}

export function studyHref() {
  const scope = readStudy()?.scope;
  if (!scope) {
    return "/decks";
  }
  const params = new URLSearchParams({ origem: scope.origin });
  if (scope.origin === "deck") {
    params.set("deckId", scope.deckId);
  }
  return `/estudar?${params}`;
}

export function markStudySaved(enabled: boolean) {
  if (enabled) {
    sessionStorage.setItem(SAVED_KEY, "1");
  }
}

export function takeStudySaved() {
  const saved = sessionStorage.getItem(SAVED_KEY) === "1";
  sessionStorage.removeItem(SAVED_KEY);
  return saved;
}
