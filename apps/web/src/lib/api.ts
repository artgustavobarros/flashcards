import {
  type CardsLabelBody,
  type CardsQuery,
  type CreateCardBody,
  cardResponseSchema,
  cardsResponseSchema,
  commentResponseSchema,
  commentsResponseSchema,
  createCardResponseSchema,
  deckResponseSchema,
  decksResponseSchema,
  imageResponseSchema,
  labelResponseSchema,
  labelsResponseSchema,
  type ProgressQuery,
  progressResponseSchema,
  type RatingBody,
  ratingResponseSchema,
  resetResponseSchema,
  type SettingsBody,
  type StudyQueueBody,
  studyQueueResponseSchema,
  todayResponseSchema,
  type UpdateCardBody,
  undoResponseSchema,
} from "@daruma/shared";
import type { z } from "zod";

// A non-2xx answer from Nest. The QueryClient sends a 401 back to the login page.
export class ApiError extends Error {
  readonly status: number;

  constructor(path: string, status: number) {
    super(`${path} answered ${status}`);
    this.name = "ApiError";
    this.status = status;
  }
}

// 404, or 400 for an id that is not a uuid: either way there is nothing at that address.
export const isMissing = (error: unknown) =>
  error instanceof ApiError && (error.status === 404 || error.status === 400);

async function send(path: string, init?: RequestInit) {
  const res = await fetch(path, init);
  if (!res.ok) {
    throw new ApiError(path, res.status);
  }
  return res;
}

async function getJson<T>(path: string, schema: z.ZodType<T>) {
  const res = await send(path);
  return schema.parse(await res.json());
}

const sendJson = (method: "POST" | "PATCH", path: string, body: unknown) =>
  send(path, {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method,
  });

// Today's Daily Review, for Início and the bell.
export const getToday = () => getJson("/api/today", todayResponseSchema);

// "Marcar como vista", or its toast's "Desfazer" with seen = false.
export const markSeen = (seen: boolean) =>
  send("/api/today/seen", { method: seen ? "POST" : "DELETE" });

// Clears the bell's dot.
export const openBell = () => send("/api/today/bell", { method: "POST" });

// Only the fields sent change.
export async function updateSettings(body: SettingsBody) {
  await sendJson("PATCH", "/api/settings", body);
}

// Progresso, for one Deck or all of them.
export function getProgress(query: ProgressQuery) {
  const params = new URLSearchParams({ period: query.period });
  if (query.deckId) {
    params.set("deckId", query.deckId);
  }
  return getJson(`/api/progress?${params}`, progressResponseSchema);
}

export const getDecks = () => getJson("/api/decks", decksResponseSchema);

export const getDeck = (id: string) =>
  getJson(`/api/decks/${id}`, deckResponseSchema);

export async function renameDeck(id: string, name: string) {
  await sendJson("PATCH", `/api/decks/${id}`, { name });
}

export const deleteDeck = (id: string) =>
  send(`/api/decks/${id}`, { method: "DELETE" });

export const restoreDeck = (id: string) =>
  send(`/api/decks/${id}/restore`, { method: "POST" });

export function getCards(query: CardsQuery) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value) {
      params.set(key, value);
    }
  }
  return getJson(`/api/cards?${params}`, cardsResponseSchema);
}

export const getCard = (id: string) =>
  getJson(`/api/cards/${id}`, cardResponseSchema);

export async function createCard(body: CreateCardBody) {
  const res = await sendJson("POST", "/api/cards", body);
  return createCardResponseSchema.parse(await res.json());
}

export async function updateCard(id: string, body: UpdateCardBody) {
  await sendJson("PATCH", `/api/cards/${id}`, body);
}

export async function getStudyQueue(body: StudyQueueBody) {
  const res = await sendJson("POST", "/api/cards/study-queue", body);
  return studyQueueResponseSchema.parse(await res.json());
}

export async function rateCard(id: string, body: RatingBody) {
  const res = await sendJson("POST", `/api/cards/${id}/ratings`, body);
  return ratingResponseSchema.parse(await res.json());
}

export async function resetSchedule(id: string) {
  const res = await send(`/api/cards/${id}/schedule-reset`, { method: "POST" });
  return resetResponseSchema.parse(await res.json());
}

export async function undoReview(id: string) {
  const res = await send(`/api/reviews/${id}/undo`, { method: "POST" });
  return undoResponseSchema.parse(await res.json());
}

export const deleteCard = (id: string) =>
  send(`/api/cards/${id}`, { method: "DELETE" });

export const restoreCard = (id: string) =>
  send(`/api/cards/${id}/restore`, { method: "POST" });

// Selection actions: all or nothing.
export async function moveCards(cardIds: string[], deckId: string) {
  await sendJson("POST", "/api/cards/move", { cardIds, deckId });
}

export async function labelCards(body: CardsLabelBody) {
  await sendJson("POST", "/api/cards/label", body);
}

export async function deleteCards(cardIds: string[]) {
  await sendJson("POST", "/api/cards/delete", { cardIds });
}

export async function restoreCards(cardIds: string[]) {
  await sendJson("POST", "/api/cards/restore", { cardIds });
}

export const getLabels = () => getJson("/api/labels", labelsResponseSchema);

// 409 when the name is taken (isTaken).
export async function createLabel(name: string) {
  const res = await sendJson("POST", "/api/labels", { name });
  return labelResponseSchema.parse(await res.json()).label;
}

export async function renameLabel(id: string, name: string) {
  await sendJson("PATCH", `/api/labels/${id}`, { name });
}

export const deleteLabel = (id: string) =>
  send(`/api/labels/${id}`, { method: "DELETE" });

export const restoreLabel = (id: string) =>
  send(`/api/labels/${id}/restore`, { method: "POST" });

export const isTaken = (error: unknown) =>
  error instanceof ApiError && error.status === 409;

// Oldest first.
export const getComments = (cardId: string) =>
  getJson(`/api/cards/${cardId}/comments`, commentsResponseSchema);

export async function createComment(cardId: string, body: string) {
  const res = await sendJson("POST", `/api/cards/${cardId}/comments`, {
    body,
  });
  return commentResponseSchema.parse(await res.json()).comment;
}

export async function updateComment(id: string, body: string) {
  await sendJson("PATCH", `/api/comments/${id}`, { body });
}

export const deleteComment = (id: string) =>
  send(`/api/comments/${id}`, { method: "DELETE" });

export const restoreComment = (id: string) =>
  send(`/api/comments/${id}/restore`, { method: "POST" });

// Returns the src to put in the editor: /api/images/<uuid>.<ext>.
export async function uploadImage(file: File) {
  const form = new FormData();
  form.append("file", file);
  const res = await send("/api/images", { body: form, method: "POST" });
  return imageResponseSchema.parse(await res.json()).src;
}
