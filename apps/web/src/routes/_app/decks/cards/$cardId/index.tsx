import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import {
  createFileRoute,
  Link,
  notFound,
  useNavigate,
} from "@tanstack/react-router";
import {
  ArrowLeft,
  ChevronsUpDown,
  Ellipsis,
  FolderInput,
  Pencil,
  Trash2,
} from "lucide-react";
import { type ReactNode, useCallback, useState } from "react";
import { toast } from "sonner";
import { DueBadge } from "~/components/cards/due-badge";
import { MoveCardDialog } from "~/components/cards/move-card-dialog";
import { ConfirmDialog } from "~/components/confirm-dialog";
import { RichTextView } from "~/components/rich-text/rich-text-view";
import { notifyEditorSoon } from "~/components/shell/new-menu";
import { usePageHeader } from "~/components/shell/page-header";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { deleteCard, isMissing, restoreCard, updateCard } from "~/lib/api";
import { cardQuery, refreshLibrary } from "~/lib/queries";
import { dueBadge, nextReviewText, STATE_LABEL } from "~/lib/schedule";

export const Route = createFileRoute("/_app/decks/cards/$cardId/")({
  component: Page,
  head: () => ({ meta: [{ title: "Card · Daruma" }] }),
  loader: async ({ context: { queryClient }, params: { cardId } }) => {
    try {
      await queryClient.ensureQueryData(cardQuery(cardId));
    } catch (error) {
      if (isMissing(error)) {
        throw notFound();
      }
      throw error;
    }
  },
  staticData: { hideNew: true, title: "Card" },
});

function Side({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="p-5">
      <p className="mb-1.5 font-medium text-muted-foreground text-xs uppercase tracking-wide">
        {label}
      </p>
      {children}
    </div>
  );
}

function Page() {
  const { cardId } = Route.useParams();
  const {
    data: { card, today },
  } = useSuspenseQuery(cardQuery(cardId));
  const [dialog, setDialog] = useState<"move" | "delete" | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  usePageHeader("Card", `/decks/${card.deckId}`);

  const move = useMutation({
    mutationFn: (deck: { id: string; name: string }) =>
      updateCard(card.id, { deckId: deck.id }),
    onError: () => toast.error("Não foi possível mover o Card."),
    onSuccess: async (_, deck) => {
      setDialog(null);
      const from = card.deckId;
      await refreshLibrary(queryClient);
      toast.success(`Card movido para ${deck.name}.`, {
        action: {
          label: "Desfazer",
          onClick: async () => {
            await updateCard(card.id, { deckId: from });
            await refreshLibrary(queryClient);
          },
        },
      });
    },
  });

  const remove = useMutation({
    mutationFn: () => deleteCard(card.id),
    onError: () => toast.error("Não foi possível apagar o Card."),
    onSuccess: async () => {
      await navigate({ params: { deckId: card.deckId }, to: "/decks/$deckId" });
      queryClient.removeQueries({ queryKey: ["cards", card.id] });
      await refreshLibrary(queryClient);
      toast.success("Card apagado.", {
        action: {
          label: "Desfazer",
          onClick: async () => {
            await restoreCard(card.id);
            await refreshLibrary(queryClient);
          },
        },
      });
    },
  });

  const late = dueBadge(card, today)?.tone === "late";
  const openMove = useCallback(() => setDialog("move"), []);
  const openDelete = useCallback(() => setDialog("delete"), []);
  // Dialogs only ever ask to close; they are opened from the menu.
  const closeDialog = useCallback(() => setDialog(null), []);
  const { mutate: moveTo } = move;
  const { mutate: removeCard } = remove;
  const confirmDelete = useCallback(() => removeCard(), [removeCard]);

  return (
    <div>
      <Link
        className="mb-4 hidden items-center gap-1.5 text-muted-foreground text-sm hover:text-foreground md:inline-flex"
        params={{ deckId: card.deckId }}
        to="/decks/$deckId"
      >
        <ArrowLeft className="size-4" />
        {card.deckName}
      </Link>
      <div className="mx-auto max-w-2xl">
        <div className="mb-3 flex items-center gap-2">
          <p className="min-w-0 flex-1 truncate text-muted-foreground text-sm">
            {card.deckName}
          </p>
          <Button onClick={notifyEditorSoon} size="sm" variant="outline">
            <Pencil data-icon="inline-start" />
            Editar
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label="Mais ações do Card"
                size="icon-sm"
                variant="ghost"
              >
                <Ellipsis />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onSelect={openMove}>
                <FolderInput />
                Mover para Deck
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={openDelete} variant="destructive">
                <Trash2 />
                Apagar Card
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="divide-y rounded-lg border bg-card shadow-card">
          <Side label="Pergunta">
            <RichTextView
              className="font-heading font-medium text-lg leading-snug"
              doc={card.question}
            />
          </Side>
          <Side label="Resposta">
            <RichTextView doc={card.answer} />
          </Side>
        </div>
        <dl className="mt-6 grid grid-cols-[7.5rem_1fr] gap-x-3 gap-y-3 px-1 text-sm">
          <dt className="pt-0.5 text-muted-foreground">Deck</dt>
          <dd className="min-w-0">
            <button
              className="inline-flex max-w-full items-center gap-1 font-medium hover:underline"
              onClick={openMove}
              type="button"
            >
              <span className="truncate">{card.deckName}</span>
              <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
            </button>
          </dd>
          <dt className="pt-0.5 text-muted-foreground">Estado</dt>
          <dd>{STATE_LABEL[card.state]}</dd>
          <dt className="pt-0.5 text-muted-foreground">Próxima revisão</dt>
          <dd className="flex flex-wrap items-center gap-2">
            {card.state === "new" ? null : (
              <DueBadge card={card} today={today} />
            )}
            <span className={late ? "text-destructive" : undefined}>
              {nextReviewText(card, today)}
            </span>
          </dd>
        </dl>
      </div>
      <MoveCardDialog
        currentDeckId={card.deckId}
        onMove={moveTo}
        onOpenChange={closeDialog}
        open={dialog === "move"}
      />
      <ConfirmDialog
        body="Os Comments e o histórico de Ratings dele também somem."
        confirmLabel="Apagar Card"
        onConfirm={confirmDelete}
        onOpenChange={closeDialog}
        open={dialog === "delete"}
        pending={remove.isPending}
        title="Apagar este Card?"
      />
    </div>
  );
}
