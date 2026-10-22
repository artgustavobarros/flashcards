import { type Label, labelNameSchema } from "@daruma/shared";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Pencil, Tag, Trash2 } from "lucide-react";
import {
  type ChangeEvent,
  type FormEvent,
  type MouseEvent,
  useCallback,
  useState,
} from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "~/components/confirm-dialog";
import { usePageHeader } from "~/components/shell/page-header";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  createLabel,
  deleteLabel,
  isTaken,
  renameLabel,
  restoreLabel,
} from "~/lib/api";
import { labelsQuery, refreshLibrary } from "~/lib/queries";
import { plural } from "~/lib/schedule";

export const Route = createFileRoute("/_app/decks/labels")({
  component: Page,
  head: () => ({ meta: [{ title: "Labels · Daruma" }] }),
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(labelsQuery),
  staticData: { hideNew: true, title: "Labels" },
});

const failed = (error: unknown, name: string, otherwise: string) =>
  toast.error(isTaken(error) ? `Já existe a Label “${name}”.` : otherwise);

function Page() {
  const { labels } = useSuspenseQuery(labelsQuery).data;
  const queryClient = useQueryClient();
  const [renaming, setRenaming] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Label | null>(null);
  usePageHeader("Labels", "/decks/cards");

  const remove = useMutation({
    mutationFn: (label: Label) => deleteLabel(label.id),
    onError: () => toast.error("Não foi possível apagar a Label."),
    onSuccess: async (_, label) => {
      setDeleting(null);
      await refreshLibrary(queryClient);
      toast.success(`Label “${label.name}” apagada.`, {
        action: {
          label: "Desfazer",
          onClick: async () => {
            try {
              await restoreLabel(label.id);
            } catch (error) {
              failed(error, label.name, "Não foi possível desfazer.");
            }
            await refreshLibrary(queryClient);
          },
        },
      });
    },
  });

  // Each row's buttons carry data-label-id so one handler serves the whole list.
  const startRename = useCallback(
    (event: MouseEvent<HTMLButtonElement>) =>
      setRenaming(event.currentTarget.dataset.labelId ?? null),
    []
  );
  const stopRename = useCallback(() => setRenaming(null), []);
  const askDelete = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      const { labelId } = event.currentTarget.dataset;
      setDeleting(labels.find((label) => label.id === labelId) ?? null);
    },
    [labels]
  );
  const closeDelete = useCallback(() => setDeleting(null), []);
  const { mutate: removeLabel } = remove;
  const confirmDelete = useCallback(() => {
    if (deleting) {
      removeLabel(deleting);
    }
  }, [deleting, removeLabel]);

  return (
    <div>
      <Link
        className="mb-4 hidden items-center gap-1.5 text-muted-foreground text-sm hover:text-foreground md:inline-flex"
        to="/decks/cards"
      >
        <ArrowLeft className="size-4" />
        Cards
      </Link>
      <div className="mx-auto max-w-xl">
        <h2 className="hidden font-heading font-semibold text-3xl tracking-tight md:block">
          Labels
        </h2>
        <p className="mb-5 text-muted-foreground text-sm md:mt-1">
          Uma Label marca Cards de qualquer Deck. Apagar a Label não apaga os
          Cards.
        </p>
        <NewLabelForm />
        <ul className="mt-4 divide-y rounded-lg border bg-card">
          {labels.map((label) =>
            renaming === label.id ? (
              <li className="p-2" key={label.id}>
                <RenameForm label={label} onDone={stopRename} />
              </li>
            ) : (
              <li
                className="flex items-center gap-3 px-4 py-2.5"
                key={label.id}
              >
                <Tag className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-sm">
                    {label.name}
                  </span>
                  <span className="block text-muted-foreground text-xs tabular-nums">
                    {plural(label.cardCount, "card", "cards")}
                  </span>
                </span>
                <Button
                  aria-label={`Renomear ${label.name}`}
                  data-label-id={label.id}
                  onClick={startRename}
                  size="icon-sm"
                  variant="ghost"
                >
                  <Pencil />
                </Button>
                <Button
                  aria-label={`Apagar ${label.name}`}
                  className="hover:text-destructive"
                  data-label-id={label.id}
                  onClick={askDelete}
                  size="icon-sm"
                  variant="ghost"
                >
                  <Trash2 />
                </Button>
              </li>
            )
          )}
          {labels.length ? null : (
            <li className="px-4 py-6 text-center text-muted-foreground text-sm">
              Nenhuma Label ainda. Crie uma acima ou ao editar um Card.
            </li>
          )}
        </ul>
      </div>
      <ConfirmDialog
        body={
          deleting?.cardCount
            ? `Ela sai de ${plural(deleting.cardCount, "Card", "Cards")}. Os Cards continuam onde estão.`
            : "Nenhum Card usa esta Label."
        }
        confirmLabel="Apagar Label"
        onConfirm={confirmDelete}
        onOpenChange={closeDelete}
        open={deleting !== null}
        pending={remove.isPending}
        title={`Apagar a Label “${deleting?.name ?? ""}”?`}
      />
    </div>
  );
}

function NewLabelForm() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const create = useMutation({
    mutationFn: createLabel,
    onError: (error, newName) =>
      failed(error, newName, "Não foi possível criar a Label."),
    onSuccess: async (label) => {
      setName("");
      await queryClient.invalidateQueries({ queryKey: ["labels"] });
      toast.success(`Label “${label.name}” criada.`);
    },
  });
  const parsed = labelNameSchema.safeParse(name);

  const onName = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => setName(event.target.value),
    []
  );
  const { mutate } = create;
  const submit = useCallback(
    (event: FormEvent) => {
      event.preventDefault();
      const valid = labelNameSchema.safeParse(name);
      if (valid.success) {
        mutate(valid.data);
      }
    },
    [mutate, name]
  );

  return (
    <form className="flex gap-2" onSubmit={submit}>
      <Input
        aria-label="Nome da nova Label"
        className="h-10 rounded-full px-4"
        maxLength={40}
        onChange={onName}
        placeholder="Nova Label"
        value={name}
      />
      <Button disabled={!parsed.success || create.isPending} type="submit">
        Criar
      </Button>
    </form>
  );
}

// Renaming happens in the row itself.
function RenameForm({ label, onDone }: { label: Label; onDone: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(label.name);
  const rename = useMutation({
    mutationFn: (newName: string) => renameLabel(label.id, newName),
    onError: (error, newName) =>
      failed(error, newName, "Não foi possível renomear a Label."),
    onSuccess: async () => {
      await refreshLibrary(queryClient);
      onDone();
      toast.success("Label renomeada.");
    },
  });
  const parsed = labelNameSchema.safeParse(name);

  const onName = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => setName(event.target.value),
    []
  );
  const { mutate } = rename;
  const submit = useCallback(
    (event: FormEvent) => {
      event.preventDefault();
      const valid = labelNameSchema.safeParse(name);
      if (valid.success) {
        mutate(valid.data);
      }
    },
    [mutate, name]
  );

  return (
    <form className="flex gap-2" onSubmit={submit}>
      <Input
        aria-label="Novo nome da Label"
        autoFocus
        className="h-10"
        maxLength={40}
        onChange={onName}
        value={name}
      />
      <Button onClick={onDone} type="button" variant="ghost">
        Cancelar
      </Button>
      <Button disabled={!parsed.success || rename.isPending} type="submit">
        Salvar
      </Button>
    </form>
  );
}
