import { type ReactNode, useCallback } from "react";
import {
  DialogActions,
  ResponsiveDialog,
} from "~/components/responsive-dialog";
import { Button } from "~/components/ui/button";

// "Apagar …?" and "Descartar …?" questions: Cancel, and one destructive action.
export function ConfirmDialog({
  body,
  cancelLabel = "Cancelar",
  confirmLabel,
  onConfirm,
  onOpenChange,
  open,
  pending = false,
  title,
}: {
  body: ReactNode;
  cancelLabel?: string;
  confirmLabel: string;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  pending?: boolean;
  title: ReactNode;
}) {
  const cancel = useCallback(() => onOpenChange(false), [onOpenChange]);
  return (
    <ResponsiveDialog
      description={body}
      onOpenChange={onOpenChange}
      open={open}
      title={title}
    >
      <DialogActions>
        <Button onClick={cancel} variant="outline">
          {cancelLabel}
        </Button>
        <Button disabled={pending} onClick={onConfirm} variant="destructive">
          {confirmLabel}
        </Button>
      </DialogActions>
    </ResponsiveDialog>
  );
}
