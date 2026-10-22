import { Layers, Plus } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
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

const OPTIONS = [
  {
    id: "deck",
    icon: Layers,
    title: "Novo Deck",
    hint: "Comece uma coleção nova",
    unavailable: "Criar Decks ainda não está disponível.",
  },
  {
    id: "cards",
    icon: Plus,
    title: "Adicionar Cards a…",
    hint: "Escolha um Deck existente",
    unavailable: "O editor de Cards ainda não existe.",
  },
] as const;

type Option = (typeof OPTIONS)[number];

// Neither screen exists yet; both options get real destinations with Decks and Cards.
// Each item carries data-option so one handler serves the whole list.
function notifyUnavailable(event: { currentTarget: EventTarget | null }) {
  const id = (event.currentTarget as HTMLElement | null)?.dataset.option;
  const option = OPTIONS.find((o) => o.id === id);
  if (option) {
    toast(option.unavailable);
  }
}

// Until the Card editor exists.
export function notifyEditorSoon() {
  toast("O editor de Cards ainda não existe.");
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
  return (
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
            onSelect={notifyUnavailable}
          >
            <OptionBody option={option} />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Mobile: an extended pill above the tab bar that opens a bottom sheet.
export function NewSheet() {
  const [open, setOpen] = useState(false);
  const openSheet = useCallback(() => setOpen(true), []);
  const closeAndNotify = useCallback(
    (event: { currentTarget: EventTarget | null }) => {
      setOpen(false);
      notifyUnavailable(event);
    },
    []
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
                onClick={closeAndNotify}
                type="button"
              >
                <OptionBody option={option} />
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
