import type { CardLabel } from "@daruma/shared";
import { Tag } from "lucide-react";
import { type MouseEvent, useCallback, useMemo } from "react";
import { LabelChip } from "~/components/labels/label-chip";
import { LabelsDialog } from "~/components/labels/labels-dialog";
import { Button } from "~/components/ui/button";

// The Labels under the Card in the editor: chips with an "x" and "Adicionar Label". They only
// change the draft; the Card is saved with them.
export function EditorLabels({
  carryOver,
  labels,
  onChange,
  onOpenChange,
  open,
}: {
  // In a batch: they stay for the next Card.
  carryOver: boolean;
  labels: CardLabel[];
  onChange: (labels: CardLabel[]) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const toggle = useCallback(
    (label: CardLabel, add: boolean) => {
      const others = labels.filter((row) => row.id !== label.id);
      onChange(add ? [...others, label] : others);
      return Promise.resolve();
    },
    [labels, onChange]
  );
  const remove = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      const { labelId } = event.currentTarget.dataset;
      onChange(labels.filter((label) => label.id !== labelId));
    },
    [labels, onChange]
  );
  const openDialog = useCallback(() => onOpenChange(true), [onOpenChange]);
  const labelSets = useMemo(() => [labels.map((label) => label.id)], [labels]);

  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5">
      {labels.map((label) => (
        <LabelChip
          id={label.id}
          key={label.id}
          name={label.name}
          onRemove={remove}
        />
      ))}
      <Button onClick={openDialog} size="sm" variant="ghost">
        <Tag data-icon="inline-start" />
        {labels.length ? "Labels" : "Adicionar Label"}
      </Button>
      {carryOver && labels.length ? (
        <span className="text-muted-foreground text-xs">
          continuam no próximo Card
        </span>
      ) : null}
      <LabelsDialog
        description="Marque as Labels deste Card."
        labelSets={labelSets}
        onOpenChange={onOpenChange}
        onToggle={toggle}
        open={open}
      />
    </div>
  );
}
