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
  ArrowRight,
  Ellipsis,
  Layers,
  Pencil,
  Play,
  Plus,
  Trash2,
} from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { CardList } from "~/components/cards/card-list";
import { ConfirmDialog } from "~/components/confirm-dialog";
import { RenameDeckDialog } from "~/components/decks/rename-deck-dialog";
import { EmptyState } from "~/components/empty-state";
import { usePageHeader } from "~/components/shell/page-header";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { deleteDeck, isMissing, restoreDeck } from "~/lib/api";
import { deckCardsQuery, deckQuery, refreshLibrary } from "~/lib/queries";
import { plural } from "~/lib/schedule";

export const Route = createFileRoute("/_app/decks/$deckId/")({
  component: Page,
  loader: async ({
    context: { queryClient },
    params: { deckId },
  }): Promise<{ name: string }> => {
    try {
      const [deck] = await Promise.all([
        queryClient.ensureQueryData(deckQuery(deckId)),
        queryClient.ensureQueryData(deckCardsQuery(deckId)),
      ]);
      return { name: deck.deck.name };
    } catch (error) {
      if (isMissing(error)) {
        throw notFound();
      }
      throw error;
    }
  },
  // After loader: head's loaderData is only typed when the loader comes first.
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.name ?? "Deck"} · Daruma` }],
  }),
  staticData: { title: "Deck" },
});

// Until the Study Session exists.
function notifyStudySoon() {
  toast("A Study Session ainda não está disponível.");
}

function Stat({
  label,
  tone,
  value,
}: {
  label: string;
  tone?: string;
  value: number;
}) {
  return (
    <div className="flex-1 px-4 py-3 first:pl-0">
      <p
        className={`font-heading font-semibold text-2xl tabular-nums ${tone ?? ""}`}
      >
        {value}
      </p>
      <p className="text-muted-foreground text-xs">{label}</p>
    </div>
  );
}

function Page() {
  const { deckId } = Route.useParams();
  const { deck } = useSuspenseQuery(deckQuery(deckId)).data;
  const {
    data: { cards, today },
  } = useSuspenseQuery(deckCardsQuery(deckId));
  const [dialog, setDialog] = useState<"rename" | "delete" | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  usePageHeader(deck.name, "/decks");

  const remove = useMutation({
    mutationFn: () => deleteDeck(deck.id),
    onError: () => toast.error("Não foi possível apagar o Deck."),
    onSuccess: async () => {
      await navigate({ to: "/decks" });
      queryClient.removeQueries({ queryKey: ["decks", deck.id] });
      await refreshLibrary(queryClient);
      toast.success(`Deck “${deck.name}” apagado.`, {
        action: {
          label: "Desfazer",
          onClick: async () => {
            await restoreDeck(deck.id);
            await refreshLibrary(queryClient);
          },
        },
      });
    },
  });

  const canStudy = deck.dueCount + deck.newCount > 0;
  const openRename = useCallback(() => setDialog("rename"), []);
  const openDelete = useCallback(() => setDialog("delete"), []);
  // Dialogs only ever ask to close; they are opened from the menu.
  const closeDialog = useCallback(() => setDialog(null), []);
  const { mutate: removeDeck } = remove;
  const confirmDelete = useCallback(() => removeDeck(), [removeDeck]);

  return (
    <div>
      <Link
        className="mb-4 hidden items-center gap-1.5 text-muted-foreground text-sm hover:text-foreground md:inline-flex"
        to="/decks"
      >
        <ArrowLeft className="size-4" />
        Decks
      </Link>
      <div className="mb-6">
        <div className="flex items-start gap-3">
          <h2 className="min-w-0 flex-1 break-words font-heading font-semibold text-2xl tracking-tight md:text-3xl">
            {deck.name}
          </h2>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label="Mais ações do Deck"
                className="-mr-2"
                size="icon"
                variant="ghost"
              >
                <Ellipsis />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onSelect={openRename}>
                <Pencil />
                Renomear Deck
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={openDelete} variant="destructive">
                <Trash2 />
                Apagar Deck
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="mt-3 flex max-w-md divide-x">
          <Stat
            label="para hoje"
            tone={deck.dueCount ? "text-warning" : undefined}
            value={deck.dueCount}
          />
          <Stat label="novos" value={deck.newCount} />
          <Stat label="cards" value={deck.cardCount} />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button
            className="flex-1 sm:flex-none"
            disabled={!canStudy}
            onClick={notifyStudySoon}
          >
            <Play data-icon="inline-start" />
            Estudar
          </Button>
          <Button asChild className="flex-1 sm:flex-none" variant="outline">
            <Link params={{ deckId }} to="/decks/$deckId/adicionar">
              <Plus data-icon="inline-start" />
              Adicionar Cards
            </Link>
          </Button>
          <Button asChild className="w-full sm:w-auto" variant="link">
            <Link to="/progresso">
              Ver progresso
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        </div>
      </div>
      {cards.length ? (
        <CardList cards={cards} today={today} />
      ) : (
        <EmptyState
          description="Escreva os primeiros Cards. Ao terminar, “Estudar agora” abre uma sessão só com eles."
          icon={Layers}
          title="Este Deck ainda não tem Cards"
        >
          <Button asChild className="mt-1">
            <Link params={{ deckId }} to="/decks/$deckId/adicionar">
              <Plus data-icon="inline-start" />
              Adicionar Cards
            </Link>
          </Button>
        </EmptyState>
      )}
      <RenameDeckDialog
        deck={deck}
        onOpenChange={closeDialog}
        open={dialog === "rename"}
      />
      <ConfirmDialog
        body={
          deck.cardCount
            ? `Os ${plural(deck.cardCount, "Card", "Cards")} deste Deck também são apagados, com os Comments e o histórico. Para guardar algum, mova antes para outro Deck.`
            : "O Deck está vazio."
        }
        confirmLabel="Apagar Deck"
        onConfirm={confirmDelete}
        onOpenChange={closeDialog}
        open={dialog === "delete"}
        pending={remove.isPending}
        title={`Apagar “${deck.name}”?`}
      />
    </div>
  );
}
