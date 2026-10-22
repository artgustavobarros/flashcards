import {
  type CreateCardBody,
  cardResponseSchema,
  cardsResponseSchema,
  createCardResponseSchema,
  deckResponseSchema,
  decksResponseSchema,
  healthSchema,
  imageResponseSchema,
  type UpdateCardBody,
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

async function sendJson<T>(
  method: "POST" | "PATCH",
  path: string,
  body: unknown,
  schema?: z.ZodType<T>
) {
  const res = await send(path, {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method,
  });
  return schema ? schema.parse(await res.json()) : undefined;
}

export function getHealth() {
  return getJson("/api/health", healthSchema);
}

export const getDecks = () => getJson("/api/decks", decksResponseSchema);

export const getDeck = (id: string) =>
  getJson(`/api/decks/${id}`, deckResponseSchema);

export const renameDeck = (id: string, name: string) =>
  sendJson("PATCH", `/api/decks/${id}`, { name });

export const deleteDeck = (id: string) =>
  send(`/api/decks/${id}`, { method: "DELETE" });

export const restoreDeck = (id: string) =>
  send(`/api/decks/${id}/restore`, { method: "POST" });

export const getCards = (filter: { deckId?: string }) =>
  getJson(`/api/cards?${new URLSearchParams(filter)}`, cardsResponseSchema);

export const getCard = (id: string) =>
  getJson(`/api/cards/${id}`, cardResponseSchema);

export const createCard = (body: CreateCardBody) =>
  sendJson("POST", "/api/cards", body, createCardResponseSchema);

export const updateCard = (id: string, body: UpdateCardBody) =>
  sendJson("PATCH", `/api/cards/${id}`, body);

export const deleteCard = (id: string) =>
  send(`/api/cards/${id}`, { method: "DELETE" });

export const restoreCard = (id: string) =>
  send(`/api/cards/${id}/restore`, { method: "POST" });

// Returns the src to put in the editor: /api/images/<uuid>.<ext>.
export async function uploadImage(file: File) {
  const form = new FormData();
  form.append("file", file);
  const res = await send("/api/images", { body: form, method: "POST" });
  return imageResponseSchema.parse(await res.json()).src;
}
