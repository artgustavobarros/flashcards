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
  Plus,
  Tag,
  Trash2,
} from "lucide-react";
import { type ReactNode, useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { CardComments } from "~/components/cards/card-comments";
import { DueBadge } from "~/components/cards/due-badge";
import { ConfirmDialog } from "~/components/confirm-dialog";
import { DeckPickerDialog } from "~/components/decks/deck-picker-dialog";
import { LabelChip } from "~/components/labels/label-chip";
import { LabelsDialog } from "~/components/labels/labels-dialog";
import { RichTextView } from "~/components/rich-text/rich-text-view";
import { usePageHeader } from "~/components/shell/page-header";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  deleteCard,
  isMissing,
  labelCards,
  restoreCard,
  updateCard,
} from "~/lib/api";
import { cardOrigin } from "~/lib/card-origin";
import {
  cardQuery,
  commentsQuery,
  labelsQuery,
  refreshLibrary,
} from "~/lib/queries";
import { dueBadge, nextReviewText, STATE_LABEL } from "~/lib/schedule";

export const Route = createFileRoute("/_app/decks/cards/$cardId/")({
  component: Page,
  head: () => ({ meta: [{ title: "Card · Daruma" }] }),
  loader: async ({ context: { queryClient }, params: { cardId } }) => {
    try {
      await Promise.all([
        queryClient.ensureQueryData(cardQuery(cardId)),
        queryClient.ensureQueryData(commentsQuery(cardId)),
        queryClient.ensureQueryData(labelsQuery),
      ]);
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
  const [dialog, setDialog] = useState<"move" | "labels" | "delete" | null>(
    null
  );
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  // Back to the list the Card was opened from, or its Deck.
  const origin = cardOrigin(card);
  usePageHeader("Card", origin.href);

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
      await navigate({ href: origin.href });
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

  // Applied on each tap; the page refreshes when the dialog closes.
  const toggleLabel = useCallback(
    async (label: { id: string }, add: boolean) => {
      await labelCards({ add, cardIds: [card.id], labelId: label.id });
      await queryClient.invalidateQueries({ queryKey: ["labels"] });
    },
    [card.id, queryClient]
  );
  const labelSets = useMemo(
    () => [card.labels.map((label) => label.id)],
    [card.labels]
  );
  const closeLabels = useCallback(() => {
    setDialog(null);
    refreshLibrary(queryClient);
  }, [queryClient]);

  const late = dueBadge(card, today)?.tone === "late";
  const openMove = useCallback(() => setDialog("move"), []);
  const openLabels = useCallback(() => setDialog("labels"), []);
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
        to={origin.href}
      >
        <ArrowLeft className="size-4" />
        {origin.label}
      </Link>
      <div className="mx-auto max-w-2xl">
        <div className="mb-3 flex items-center gap-2">
          <p className="min-w-0 flex-1 truncate text-muted-foreground text-sm">
            {card.deckName}
          </p>
          <Button asChild size="sm" variant="outline">
            <Link params={{ cardId }} to="/decks/cards/$cardId/editar">
              <Pencil data-icon="inline-start" />
              Editar
            </Link>
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
              <DropdownMenuItem onSelect={openLabels}>
                <Tag />
                Labels
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
          <dt className="pt-0.5 text-muted-foreground">Labels</dt>
          <dd className="flex min-w-0 flex-wrap items-center gap-1.5">
            {card.labels.map((label) => (
              <LabelChip key={label.id} name={label.name} />
            ))}
            <button
              className="inline-flex items-center gap-1 rounded-full border border-dashed px-2.5 py-0.5 text-muted-foreground text-xs hover:text-foreground"
              onClick={openLabels}
              type="button"
            >
              <Plus className="size-3" />
              {card.labels.length ? "Editar" : "Label"}
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
        <CardComments cardId={card.id} />
      </div>
      <DeckPickerDialog
        currentDeckId={card.deckId}
        description="Mover este Card. O agendamento não muda."
        onOpenChange={closeDialog}
        onPick={moveTo}
        open={dialog === "move"}
        title="Mover para Deck"
      />
      <LabelsDialog
        description="Marque as Labels deste Card."
        labelSets={labelSets}
        onOpenChange={closeLabels}
        onToggle={toggleLabel}
        open={dialog === "labels"}
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
