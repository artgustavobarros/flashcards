import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Layers, Plus } from "lucide-react";
import { useCallback, useState } from "react";
import { DeckPickerDialog } from "~/components/decks/deck-picker-dialog";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";
import { decksQuery } from "~/lib/queries";

const OPTIONS = [
  {
    id: "deck",
    icon: Layers,
    title: "Novo Deck",
    hint: "Comece uma coleção nova",
  },
  {
    id: "cards",
    icon: Plus,
    title: "Adicionar Cards a…",
    hint: "Escolha um Deck existente",
  },
] as const;

type Option = (typeof OPTIONS)[number];

// "Novo Deck" opens the editor; "Adicionar Cards a…" asks for the Deck first (straight to
// "Novo Deck" when there is none). Each item carries data-option so one handler serves the list.
function useNewOptions() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [picking, setPicking] = useState(false);

  const choose = useCallback(
    async (event: { currentTarget: EventTarget | null }) => {
      const id = (event.currentTarget as HTMLElement | null)?.dataset.option;
      if (id === "cards") {
        const { decks } = await queryClient.ensureQueryData(decksQuery);
        if (decks.length) {
          setPicking(true);
          return;
        }
      }
      await navigate({ to: "/decks/novo" });
    },
    [navigate, queryClient]
  );
  const pick = useCallback(
    (deck: { id: string }) => {
      setPicking(false);
      navigate({ params: { deckId: deck.id }, to: "/decks/$deckId/adicionar" });
    },
    [navigate]
  );
  const closePicker = useCallback(() => setPicking(false), []);

  const picker = (
    <DeckPickerDialog
      onOpenChange={closePicker}
      onPick={pick}
      open={picking}
      title="Adicionar Cards a…"
    />
  );
  return { choose, picker };
}

function OptionBody({ option }: { option: Option }) {
  return (
    <>
      <option.icon className="mt-0.5 text-muted-foreground" />
      <span>
        <span className="block font-medium text-sm">{option.title}</span>
        <span className="block text-muted-foreground text-xs">
          {option.hint}
        </span>
      </span>
    </>
  );
}

// Desktop: a menu under the green "+ Novo" pill.
export function NewMenu() {
  const { choose, picker } = useNewOptions();
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>
            <Plus data-icon="inline-start" />
            Novo
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          {OPTIONS.map((option) => (
            <DropdownMenuItem
              className="items-start gap-3 px-3 py-2.5"
              data-option={option.id}
              key={option.id}
              onSelect={choose}
            >
              <OptionBody option={option} />
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {picker}
    </>
  );
}

// Mobile: an extended pill above the tab bar that opens a bottom sheet.
export function NewSheet() {
  const [open, setOpen] = useState(false);
  const openSheet = useCallback(() => setOpen(true), []);
  const { choose, picker } = useNewOptions();
  const closeAndChoose = useCallback(
    (event: { currentTarget: EventTarget | null }) => {
      setOpen(false);
      choose(event);
    },
    [choose]
  );

  return (
    <>
      <button
        className="fixed right-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-30 inline-flex h-12 items-center gap-2 rounded-full bg-primary px-5 font-semibold text-primary-foreground text-sm shadow-pop md:hidden"
        onClick={openSheet}
        type="button"
      >
        <Plus className="size-5" />
        Novo
      </button>
      <Sheet onOpenChange={setOpen} open={open}>
        <SheetContent
          className="rounded-t-xl pb-[calc(1rem+env(safe-area-inset-bottom))]"
          showCloseButton={false}
          side="bottom"
        >
          <div className="mx-auto mt-3 h-1.5 w-10 rounded-full bg-muted" />
          <SheetHeader className="pb-0">
            <SheetTitle className="font-heading text-lg">Criar</SheetTitle>
            <SheetDescription className="sr-only">
              Crie um Deck ou adicione Cards a um Deck
            </SheetDescription>
          </SheetHeader>
          <div className="px-2">
            {OPTIONS.map((option) => (
              <button
                className="flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left hover:bg-accent [&_svg]:size-4"
                data-option={option.id}
                key={option.id}
                onClick={closeAndChoose}
                type="button"
              >
                <OptionBody option={option} />
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
      {picker}
    </>
  );
}
