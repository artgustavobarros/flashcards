import { foldText, labelKey, labelNameSchema } from "@daruma/shared";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import {
  type ChangeEvent,
  type MouseEvent,
  useCallback,
  useState,
} from "react";
import { toast } from "sonner";
import { CheckBox } from "~/components/cards/check-box";
import { ResponsiveDialog } from "~/components/responsive-dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { createLabel, isTaken } from "~/lib/api";
import { labelsQuery } from "~/lib/queries";

// Puts a Label on all the Cards, or takes it off all of them.
export type ToggleLabel = (labelId: string, add: boolean) => Promise<void>;

// Labels for one or more Cards: a box per Label, checked, empty, or a dash when only some of
// the Cards have it. Tapping applies right away. The search offers "Criar Label “x”".
// labelSets holds each Card's Label ids when the dialog opens; the dialog tracks them after.
export function LabelsDialog({
  description,
  labelSets,
  onOpenChange,
  onToggle,
  open,
}: {
  description: string;
  labelSets: string[][];
  onOpenChange: (open: boolean) => void;
  onToggle: ToggleLabel;
  open: boolean;
}) {
  const close = useCallback(() => onOpenChange(false), [onOpenChange]);
  return (
    <ResponsiveDialog
      description={description}
      onOpenChange={onOpenChange}
      open={open}
      title="Labels"
    >
      {/* Mounted only while open, so it starts from the Cards' Labels every time. */}
      <LabelsPicker labelSets={labelSets} onDone={close} onToggle={onToggle} />
    </ResponsiveDialog>
  );
}

function LabelsPicker({
  labelSets,
  onDone,
  onToggle,
}: {
  labelSets: string[][];
  onDone: () => void;
  onToggle: ToggleLabel;
}) {
  const queryClient = useQueryClient();
  const labels = useQuery(labelsQuery).data?.labels ?? [];
  const [sets, setSets] = useState(() => labelSets.map((set) => new Set(set)));
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);

  const term = search.trim();
  const rows = labels.filter((label) =>
    foldText(label.name).includes(foldText(term))
  );
  const exists = labels.some(
    (label) => labelKey(label.name) === labelKey(term)
  );

  const apply = useCallback(
    async (labelId: string, add: boolean) => {
      const before = sets;
      setSets(
        sets.map((set) => {
          const next = new Set(set);
          if (add) {
            next.add(labelId);
          } else {
            next.delete(labelId);
          }
          return next;
        })
      );
      try {
        await onToggle(labelId, add);
      } catch {
        setSets(before);
        toast.error("Não foi possível mudar as Labels.");
      }
    },
    [onToggle, sets]
  );

  // Each row carries data-label-id so one handler serves the whole list.
  const toggle = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      const { labelId } = event.currentTarget.dataset;
      if (labelId) {
        const all = sets.every((set) => set.has(labelId));
        apply(labelId, !all);
      }
    },
    [apply, sets]
  );

  const create = useCallback(async () => {
    const name = labelNameSchema.safeParse(term);
    if (!name.success) {
      toast.error(name.error.issues[0]?.message);
      return;
    }
    setCreating(true);
    try {
      const label = await createLabel(name.data);
      setSearch("");
      await apply(label.id, true);
      await queryClient.invalidateQueries({ queryKey: ["labels"] });
      toast.success(`Label “${label.name}” criada.`);
    } catch (error) {
      toast.error(
        isTaken(error)
          ? `Já existe a Label “${name.data}”.`
          : "Não foi possível criar a Label."
      );
    } finally {
      setCreating(false);
    }
  }, [apply, queryClient, term]);

  const onSearch = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => setSearch(event.target.value),
    []
  );

  return (
    <>
      <Input
        aria-label="Buscar ou criar Label"
        className="rounded-full px-4"
        onChange={onSearch}
        placeholder="Buscar ou criar Label…"
        value={search}
      />
      <div className="-mx-2 mt-2 min-h-0 overflow-y-auto">
        {rows.map((label) => {
          const count = sets.filter((set) => set.has(label.id)).length;
          let checked: boolean | "mixed" = count > 0 && "mixed";
          if (count === sets.length) {
            checked = true;
          }
          return (
            <label
              className="flex w-full cursor-pointer items-center gap-3 rounded-md px-2.5 py-2 text-sm hover:bg-accent"
              htmlFor={`label-${label.id}`}
              key={label.id}
            >
              <CheckBox
                checked={checked}
                data-label-id={label.id}
                id={`label-${label.id}`}
                onClick={toggle}
              />
              <span className="min-w-0 flex-1 truncate">{label.name}</span>
              <span className="text-muted-foreground text-xs tabular-nums">
                {label.cardCount}
              </span>
            </label>
          );
        })}
        {term && !exists ? (
          <button
            className="flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left text-primary text-sm hover:bg-accent disabled:opacity-60"
            disabled={creating}
            onClick={create}
            type="button"
          >
            <Plus className="size-4" />
            <span className="min-w-0 truncate">Criar Label “{term}”</span>
          </button>
        ) : null}
        {labels.length || term ? null : (
          <p className="py-6 text-center text-muted-foreground text-sm">
            Nenhuma Label ainda. Digite um nome para criar.
          </p>
        )}
      </div>
      <div className="-mx-5 mt-3 flex justify-end border-t px-5 pt-3">
        <Button onClick={onDone}>Pronto</Button>
      </div>
    </>
  );
}
