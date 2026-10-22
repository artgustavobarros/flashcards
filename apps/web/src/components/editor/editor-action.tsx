import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "~/components/ui/button";
import type { Side } from "./card-editor";

// "Escrever a resposta" on the question side; back and save on the answer side. Under the Card
// on desktop, in a bar at the bottom of the screen on mobile, where the thumb reaches.
export function EditorAction({
  editingSaved,
  onBack,
  onFlip,
  onSave,
  saving,
  side,
}: {
  editingSaved: boolean;
  onBack: () => void;
  onFlip: () => void;
  onSave: () => void;
  saving: boolean;
  side: Side;
}) {
  const action =
    side === "question" ? (
      <Button className="w-full" onClick={onFlip} size="lg">
        Escrever a resposta
        <ChevronRight data-icon="inline-end" />
      </Button>
    ) : (
      <div className="grid grid-cols-[auto_1fr] gap-2">
        <Button
          aria-label="Voltar à pergunta"
          className="px-4"
          onClick={onBack}
          size="lg"
          variant="outline"
        >
          <ChevronLeft />
        </Button>
        <Button className="w-full" disabled={saving} onClick={onSave} size="lg">
          {editingSaved ? "Salvar alterações" : "Salvar e próximo"}
        </Button>
      </div>
    );

  return (
    <>
      <div className="mt-6 hidden md:block">
        {action}
        <p className="mt-2 text-center text-muted-foreground text-xs">
          <Kbd>Ctrl</Kbd> + <Kbd>Enter</Kbd>{" "}
          {side === "question" ? "vira o Card" : "salva"}
        </p>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden">
        {action}
      </div>
    </>
  );
}

function Kbd({ children }: { children: string }) {
  return (
    <kbd className="rounded border px-1 font-sans text-[0.75em]">
      {children}
    </kbd>
  );
}
