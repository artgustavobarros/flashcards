import { deckNameSchema } from "@daruma/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type ChangeEvent, type FormEvent, useCallback, useState } from "react";
import { toast } from "sonner";
import {
  DialogActions,
  ResponsiveDialog,
} from "~/components/responsive-dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { renameDeck } from "~/lib/api";
import { refreshLibrary } from "~/lib/queries";

export function RenameDeckDialog({
  deck,
  onOpenChange,
  open,
}: {
  deck: { id: string; name: string };
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const close = useCallback(() => onOpenChange(false), [onOpenChange]);
  return (
    <ResponsiveDialog
      onOpenChange={onOpenChange}
      open={open}
      title="Renomear Deck"
    >
      {/* Mounted only while open, so it starts from the current name every time. */}
      <RenameForm deck={deck} onDone={close} />
    </ResponsiveDialog>
  );
}

function RenameForm({
  deck,
  onDone,
}: {
  deck: { id: string; name: string };
  onDone: () => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(deck.name);
  const rename = useMutation({
    mutationFn: (newName: string) => renameDeck(deck.id, newName),
    onError: () => toast.error("Não foi possível renomear o Deck."),
    onSuccess: async () => {
      await refreshLibrary(queryClient);
      onDone();
      toast.success("Deck renomeado.");
    },
  });
  const parsed = deckNameSchema.safeParse(name);

  const onName = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => setName(event.target.value),
    []
  );
  const { mutate } = rename;
  const submit = useCallback(
    (event: FormEvent) => {
      event.preventDefault();
      const valid = deckNameSchema.safeParse(name);
      if (valid.success) {
        mutate(valid.data);
      }
    },
    [mutate, name]
  );

  return (
    <form onSubmit={submit}>
      <Input
        aria-label="Nome do Deck"
        autoFocus
        maxLength={80}
        onChange={onName}
        value={name}
      />
      <DialogActions>
        <Button onClick={onDone} type="button" variant="outline">
          Cancelar
        </Button>
        <Button disabled={!parsed.success || rename.isPending} type="submit">
          Salvar
        </Button>
      </DialogActions>
    </form>
  );
}
