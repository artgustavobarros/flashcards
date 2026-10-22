import type { CardListItem } from "@daruma/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FolderInput, Tag, Trash2, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "~/components/confirm-dialog";
import { DeckPickerDialog } from "~/components/decks/deck-picker-dialog";
import { LabelsDialog } from "~/components/labels/labels-dialog";
import { deleteCards, labelCards, moveCards, restoreCards } from "~/lib/api";
import { refreshLibrary } from "~/lib/queries";
import { plural } from "~/lib/schedule";
import { CheckBox } from "./check-box";

const action =
  "inline-flex h-9 items-center gap-1.5 rounded-full px-3 hover:bg-background/15";

const these = (count: number) =>
  count === 1 ? "este Card" : plural(count, "Card", "Cards");

// The dark bar that replaces the count line while Cards are selected: Mover, Label, Apagar, ×.
// Every action applies to the selected Cards, then clears the selection.
export function SelectionBar({
  allSelected,
  cards,
  onClear,
  onToggleAll,
}: {
  allSelected: boolean;
  cards: CardListItem[];
  onClear: () => void;
  onToggleAll: () => void;
}) {
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState<"move" | "labels" | "delete" | null>(
    null
  );
  const ids = useMemo(() => cards.map((card) => card.id), [cards]);
  const decks = new Set(cards.map((card) => card.deckId));
  const count = cards.length;

  const move = useMutation({
    mutationFn: (deck: { id: string; name: string }) => moveCards(ids, deck.id),
    onError: () => toast.error("Não foi possível mover os Cards."),
    onSuccess: async (_, deck) => {
      setDialog(null);
      onClear();
      // Undo sends each Card back to the Deck it came from.
      const from = new Map<string, string[]>();
      for (const card of cards) {
        from.set(card.deckId, [...(from.get(card.deckId) ?? []), card.id]);
      }
      await refreshLibrary(queryClient);
      toast.success(
        `${count === 1 ? "Card movido" : plural(count, "Card movido", "Cards movidos")} para ${deck.name}.`,
        {
          action: {
            label: "Desfazer",
            onClick: async () => {
              await Promise.all(
                [...from].map(([deckId, cardIds]) => moveCards(cardIds, deckId))
              );
              await refreshLibrary(queryClient);
            },
          },
        }
      );
    },
  });

  const remove = useMutation({
    mutationFn: () => deleteCards(ids),
    onError: () => toast.error("Não foi possível apagar os Cards."),
    onSuccess: async () => {
      setDialog(null);
      onClear();
      await refreshLibrary(queryClient);
      toast.success(
        count === 1
          ? "Card apagado."
          : `${plural(count, "Card apagado", "Cards apagados")}.`,
        {
          action: {
            label: "Desfazer",
            onClick: async () => {
              await restoreCards(ids);
              await refreshLibrary(queryClient);
            },
          },
        }
      );
    },
  });

  // The list refreshes only when the dialog closes: with a Label filter on, taking the Label
  // off would drop the Cards from the list, and the selection with them, mid-dialog.
  const toggleLabel = useCallback(
    async (labelId: string, add: boolean) => {
      await labelCards({ add, cardIds: ids, labelId });
      await queryClient.invalidateQueries({ queryKey: ["labels"] });
    },
    [ids, queryClient]
  );
  const labelSets = useMemo(
    () => cards.map((card) => card.labels.map((label) => label.id)),
    [cards]
  );

  const openMove = useCallback(() => setDialog("move"), []);
  const openLabels = useCallback(() => setDialog("labels"), []);
  const openDelete = useCallback(() => setDialog("delete"), []);
  const closeDialog = useCallback(() => setDialog(null), []);
  // Done with the Labels: the Cards keep them, the selection goes.
  const closeLabels = useCallback(() => {
    setDialog(null);
    onClear();
    refreshLibrary(queryClient);
  }, [onClear, queryClient]);
  const { mutate: moveTo } = move;
  const { mutate: removeAll } = remove;
  const confirmDelete = useCallback(() => removeAll(), [removeAll]);

  return (
    <>
      <div className="sticky top-16 z-20 -mx-2 flex h-12 items-center gap-1 rounded-full bg-foreground px-2 text-background text-sm shadow-pop md:top-20">
        <CheckBox
          aria-label="Selecionar todos"
          checked={allSelected || "mixed"}
          className="ml-1.5 border-background/40"
          onClick={onToggleAll}
        />
        <span className="mr-auto ml-2 font-medium tabular-nums">
          {count}{" "}
          <span className="hidden sm:inline">
            {count === 1 ? "selecionado" : "selecionados"}
          </span>
        </span>
        <button className={action} onClick={openMove} type="button">
          <FolderInput className="size-4" />
          <span className="hidden sm:inline">Mover</span>
        </button>
        <button className={action} onClick={openLabels} type="button">
          <Tag className="size-4" />
          <span className="hidden sm:inline">Label</span>
        </button>
        <button className={action} onClick={openDelete} type="button">
          <Trash2 className="size-4" />
          <span className="hidden sm:inline">Apagar</span>
        </button>
        <button
          aria-label="Cancelar seleção"
          className="grid size-9 place-items-center rounded-full hover:bg-background/15"
          onClick={onClear}
          type="button"
        >
          <X className="size-4" />
        </button>
      </div>
      <DeckPickerDialog
        currentDeckId={decks.size === 1 ? cards[0]?.deckId : undefined}
        description={`Mover ${these(count)}. O agendamento não muda.`}
        onOpenChange={closeDialog}
        onPick={moveTo}
        open={dialog === "move"}
        title="Mover para Deck"
      />
      <LabelsDialog
        description={
          count === 1
            ? "Marque as Labels deste Card."
            : `Para ${these(count)}. O traço indica que só alguns têm a Label.`
        }
        labelSets={labelSets}
        onOpenChange={closeLabels}
        onToggle={toggleLabel}
        open={dialog === "labels"}
      />
      <ConfirmDialog
        body={
          count === 1
            ? "Os Comments e o histórico de Ratings dele também somem."
            : "Os Comments e o histórico de Ratings desses Cards também somem."
        }
        confirmLabel="Apagar"
        onConfirm={confirmDelete}
        onOpenChange={closeDialog}
        open={dialog === "delete"}
        pending={remove.isPending}
        title={
          count === 1
            ? "Apagar este Card?"
            : `Apagar ${plural(count, "Card", "Cards")}?`
        }
      />
    </>
  );
}
