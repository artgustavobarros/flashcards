import { cardResponseSchema } from "@daruma/shared";
import { QueryClient } from "@tanstack/react-query";
import { afterEach, describe, expect, test, vi } from "vitest";
import { getCard } from "~/lib/api";
import { cardQuery, refreshCard } from "~/lib/queries";

vi.mock("~/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("~/lib/api")>()),
  getCard: vi.fn(),
}));

const cardId = "1cd26d72-8f97-492b-98eb-955ddf7491f7";
const cardResponse = (questionText: string) =>
  cardResponseSchema.parse({
    card: {
      answer: { content: [], type: "doc" },
      answerText: "Answer",
      commentCount: 0,
      deckId: "6f47e35d-4154-44a6-b6c7-ba5f6004977a",
      deckName: "Anatomia",
      due: "2026-10-27",
      id: cardId,
      labels: [],
      question: { content: [], type: "doc" },
      questionText,
      resetAt: null,
      state: "learning",
    },
    today: "2026-10-26",
  });

describe("refreshCard", () => {
  afterEach(() => vi.clearAllMocks());

  test("refreshes cached Card data after an edit", async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(
      cardQuery(cardId).queryKey,
      cardResponse("old question")
    );
    vi.mocked(getCard).mockResolvedValue(cardResponse("updated question"));

    const result = await refreshCard(queryClient, cardId);

    expect(result.card.questionText).toBe("updated question");
    expect(queryClient.getQueryData(cardQuery(cardId).queryKey)).toEqual(
      cardResponse("updated question")
    );
    queryClient.clear();
  });
});
