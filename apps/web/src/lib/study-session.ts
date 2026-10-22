import type { Card, StudyQueueBody } from "@daruma/shared";

export type StudyOrigin = StudyQueueBody["origin"];

interface Snapshot {
  due: Record<string, string | null>;
  finished: string[];
  first: Record<string, number>;
  queue: string[];
}

interface HistoryEntry {
  previous: Snapshot;
  reviewId: string;
}

export interface StudySession extends Snapshot {
  history: HistoryEntry[];
  ids: string[];
  origin: StudyOrigin;
  revealed: boolean;
  startedAt: number;
}

export function createStudySession(
  ids: string[],
  origin: StudyOrigin,
  startedAt = Date.now()
): StudySession {
  return {
    due: {},
    finished: [],
    first: {},
    history: [],
    ids,
    origin,
    queue: [...ids],
    revealed: false,
    startedAt,
  };
}

export function applyRating(
  session: StudySession,
  cardId: string,
  rating: number,
  reviewId: string,
  due: string | null
): StudySession {
  if (session.queue[0] !== cardId) {
    throw new Error("Rating fora da posição atual da sessão.");
  }
  const previous: Snapshot = {
    due: session.due,
    finished: session.finished,
    first: session.first,
    queue: session.queue,
  };
  const remaining = session.queue.slice(1);
  return {
    ...session,
    due: { ...session.due, [cardId]: due },
    finished: rating === 1 ? session.finished : [...session.finished, cardId],
    first:
      cardId in session.first
        ? session.first
        : { ...session.first, [cardId]: rating },
    history: [...session.history, { previous, reviewId }],
    queue: rating === 1 ? [...remaining, cardId] : remaining,
    revealed: false,
  };
}

export function undoRating(session: StudySession): StudySession {
  const last = session.history.at(-1);
  if (!last) {
    return session;
  }
  return {
    ...session,
    ...last.previous,
    history: session.history.slice(0, -1),
    revealed: true,
  };
}

export function studyCounts(
  session: StudySession,
  cards: Pick<Card, "id" | "state">[]
) {
  const byId = new Map(cards.map((card) => [card.id, card]));
  return session.queue.reduce(
    (counts, id) => {
      if (id in session.first) {
        counts.repeat += 1;
      } else if (byId.get(id)?.state === "new") {
        counts.new += 1;
      } else {
        counts.review += 1;
      }
      return counts;
    },
    { new: 0, repeat: 0, review: 0 }
  );
}
