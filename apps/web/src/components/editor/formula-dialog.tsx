import katex from "katex";
import {
  type ChangeEvent,
  type FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  DialogActions,
  ResponsiveDialog,
} from "~/components/responsive-dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

// A new formula, or one already in the text (clicked in the editor).
export interface FormulaTarget {
  latex: string;
  pos?: number;
}

export function FormulaDialog({
  onOpenChange,
  onSave,
  target,
}: {
  onOpenChange: (open: boolean) => void;
  onSave: (latex: string, target: FormulaTarget) => void;
  target: FormulaTarget | null;
}) {
  return (
    <ResponsiveDialog
      description="Escreva em LaTeX, por exemplo \frac{a}{b} ou x^2."
      onOpenChange={onOpenChange}
      open={target !== null}
      title={target?.pos === undefined ? "Inserir fórmula" : "Editar fórmula"}
    >
      {target ? <FormulaForm onSave={onSave} target={target} /> : null}
    </ResponsiveDialog>
  );
}

function FormulaForm({
  onSave,
  target,
}: {
  onSave: (latex: string, target: FormulaTarget) => void;
  target: FormulaTarget;
}) {
  const [latex, setLatex] = useState(target.latex);
  const preview = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (preview.current) {
      katex.render(latex || ";", preview.current, {
        displayMode: true,
        throwOnError: false,
      });
    }
  }, [latex]);

  const onLatex = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => setLatex(event.target.value),
    []
  );
  const submit = useCallback(
    (event: FormEvent) => {
      event.preventDefault();
      onSave(latex.trim(), target);
    },
    [latex, onSave, target]
  );

  return (
    <form onSubmit={submit}>
      <Input
        aria-label="Fórmula em LaTeX"
        autoFocus
        className="font-mono"
        onChange={onLatex}
        placeholder="x = \frac{-b \pm \sqrt{\Delta}}{2a}"
        value={latex}
      />
      <div
        aria-hidden
        className="mt-3 min-h-14 overflow-x-auto rounded-md bg-muted/60 px-3 py-2"
        ref={preview}
      />
      <DialogActions>
        <Button
          disabled={!(latex.trim() || target.pos !== undefined)}
          type="submit"
        >
          {target.pos === undefined ? "Inserir" : "Salvar"}
        </Button>
      </DialogActions>
    </form>
  );
}
