import {
  type Card,
  type CardLabel,
  deckNameSchema,
  EMPTY_RICH_TEXT,
  type RichText,
} from "@daruma/shared";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { EditorContent } from "@tiptap/react";
import { cn } from "cn";
import { Play } from "lucide-react";
import {
  type ChangeEvent,
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "~/components/confirm-dialog";
import { Button } from "~/components/ui/button";
import { createCard, updateCard } from "~/lib/api";
import { refreshLibrary } from "~/lib/queries";
import { BatchStrip } from "./batch-strip";
import { EditorAction } from "./editor-action";
import { EditorHeader } from "./editor-header";
import { EditorLabels } from "./editor-labels";
import { EditorToolbar } from "./editor-toolbar";
import { FieldError } from "./field-error";
import { FormulaDialog, type FormulaTarget } from "./formula-dialog";
import { SideTabs } from "./side-tabs";
import { isFilled, useSideEditor } from "./use-side-editor";

// "Adicionar Cards" to a Deck, "Novo Deck" (the Deck is created with its first Card), or
// "Editar Card" (opened from the Card page, goes back to it).
export type EditorMode =
  | { deck: { id: string; name: string }; kind: "batch" }
  | { kind: "new-deck" }
  | { card: Card; kind: "edit" };

export type Side = "question" | "answer";

interface Draft {
  answer: RichText;
  labels: CardLabel[];
  question: RichText;
}

const EMPTY_DRAFT: Draft = {
  answer: EMPTY_RICH_TEXT,
  labels: [],
  question: EMPTY_RICH_TEXT,
};

// What the API takes: the Labels as ids.
const toBody = ({ labels, ...draft }: Draft) => ({
  ...draft,
  labelIds: labels.map((label) => label.id),
});

export interface SavedCard extends Draft {
  id: string;
}

type Errors = Partial<Record<Side | "deck", string>>;
type Leave = "close" | "study";

const MISSING: Record<Side, string> = {
  answer: "Escreva a resposta.",
  question: "Escreva a pergunta.",
};

function initialDeck(mode: EditorMode) {
  if (mode.kind === "batch") {
    return mode.deck;
  }
  if (mode.kind === "edit") {
    return { id: mode.card.deckId, name: mode.card.deckName };
  }
  return null;
}

const initialLabels = (mode: EditorMode): CardLabel[] =>
  mode.kind === "edit" ? mode.card.labels : [];

// Until the Study Session exists, "Estudar agora" ends on the Deck.
const notifyStudySoon = () =>
  toast("A Study Session ainda não está disponível.");

export function CardEditor({ mode }: { mode: EditorMode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const editing = mode.kind === "edit" ? mode.card : null;

  const [side, setSide] = useState<Side>("question");
  const [filled, setFilled] = useState({ answer: false, question: false });
  const [errors, setErrors] = useState<Errors>({});
  const [deckName, setDeckName] = useState("");
  const [batch, setBatch] = useState<SavedCard[]>([]);
  // A Card of the batch loaded back into the editor, and the draft it replaced.
  const [batchEditId, setBatchEditId] = useState<string | null>(null);
  const stash = useRef<Draft | null>(null);
  const [flashId, setFlashId] = useState<string | null>(null);
  const [formula, setFormula] = useState<
    (FormulaTarget & { side: Side }) | null
  >(null);
  const [leaving, setLeaving] = useState<Leave | null>(null);
  const [labelsOpen, setLabelsOpen] = useState(false);
  // The Labels of the Card in the editor. Also in a ref, so readDraft stays stable and the
  // "unsaved" baseline isn't reset when they change.
  const [labels, setLabelsState] = useState(() => initialLabels(mode));
  const labelsRef = useRef(labels);
  const setLabels = useCallback((next: CardLabel[]) => {
    labelsRef.current = next;
    setLabelsState(next);
  }, []);
  const [saving, setSaving] = useState(false);
  // Read right after a save, before a re-render, so they live in refs.
  const deck = useRef(initialDeck(mode));
  const savedCount = useRef(0);
  const baseline = useRef("");
  const deckInput = useRef<HTMLInputElement>(null);

  // Recomputes the "filled" dots and clears fixed errors. Assigned below, once the editors
  // exist; the editors call it on every change.
  const refreshRef = useRef<() => void>(() => undefined);
  const refresh = useCallback(() => refreshRef.current(), []);

  const question = useSideEditor({
    content: editing?.question,
    onChange: refresh,
    onFormulaClick: (latex, pos) =>
      setFormula({ latex, pos, side: "question" }),
    placeholder: "Escreva a pergunta…",
  });
  const answer = useSideEditor({
    content: editing?.answer,
    onChange: refresh,
    onFormulaClick: (latex, pos) => setFormula({ latex, pos, side: "answer" }),
    placeholder: "Escreva a resposta…",
  });
  const editors = useMemo(() => ({ answer, question }), [answer, question]);

  const readDraft = useCallback(
    (): Draft => ({
      answer: answer.getJSON() as RichText,
      labels: labelsRef.current,
      question: question.getJSON() as RichText,
    }),
    [answer, question]
  );

  refreshRef.current = () => {
    const now = { answer: isFilled(answer), question: isFilled(question) };
    setFilled(now);
    setErrors((current) => ({
      ...current,
      answer: now.answer ? undefined : current.answer,
      question: now.question ? undefined : current.question,
    }));
  };

  const loadDraft = useCallback(
    (draft: Draft) => {
      question.commands.setContent(draft.question);
      answer.commands.setContent(draft.answer);
      setLabels(draft.labels);
      baseline.current = JSON.stringify(readDraft());
      refreshRef.current();
    },
    [answer, question, readDraft, setLabels]
  );

  // What counts as "unsaved": a saved Card that differs from how it was loaded, or a new Card
  // with any content (including a draft brought back after editing a batch pill).
  const isDirty = useCallback(
    () =>
      editing || batchEditId
        ? JSON.stringify(readDraft()) !== baseline.current
        : isFilled(question) || isFilled(answer),
    [answer, batchEditId, editing, question, readDraft]
  );

  useEffect(() => {
    baseline.current = JSON.stringify(readDraft());
    refreshRef.current();
  }, [readDraft]);

  // Focus follows the side shown. "Novo Deck" starts in the name field instead.
  const focusOnSide = useRef(mode.kind !== "new-deck");
  // biome-ignore lint/correctness/useExhaustiveDependencies: only when the side changes; editors are stable.
  useEffect(() => {
    if (focusOnSide.current) {
      editors[side].commands.focus("end");
    }
    focusOnSide.current = true;
  }, [side]);

  const flash = useCallback((id: string) => {
    setFlashId(id);
    setTimeout(
      () => setFlashId((current) => (current === id ? null : current)),
      1400
    );
  }, []);

  const validate = useCallback(() => {
    const next: Errors = {};
    for (const key of ["question", "answer"] as const) {
      if (!isFilled(editors[key])) {
        next[key] = MISSING[key];
      }
    }
    if (!(deck.current || deckNameSchema.safeParse(deckName).success)) {
      next.deck = "Dê um nome ao Deck.";
    }
    setErrors(next);
    if (next.question || next.answer) {
      setSide(next.question ? "question" : "answer");
      editors[next.question ? "question" : "answer"].commands.focus("end");
    } else if (next.deck) {
      deckInput.current?.focus();
    }
    return Object.keys(next).length === 0;
  }, [deckName, editors]);

  // Saves the Card in the editor. Returns false when nothing was saved.
  const save = useCallback(async () => {
    if (!validate()) {
      return false;
    }
    const draft = readDraft();
    setSaving(true);
    try {
      if (editing) {
        await updateCard(editing.id, toBody(draft));
        await refreshLibrary(queryClient);
        baseline.current = JSON.stringify(draft);
        await navigate({
          params: { cardId: editing.id },
          to: "/decks/cards/$cardId",
        });
        toast.success("Card salvo.");
        return true;
      }
      if (batchEditId) {
        await updateCard(batchEditId, toBody(draft));
        setBatch((cards) =>
          cards.map((card) =>
            card.id === batchEditId ? { ...card, ...draft } : card
          )
        );
        flash(batchEditId);
        setBatchEditId(null);
        loadDraft(stash.current ?? EMPTY_DRAFT);
        stash.current = null;
      } else {
        const { card } = await createCard(
          deck.current
            ? { ...toBody(draft), deckId: deck.current.id }
            : { ...toBody(draft), deckName: deckNameSchema.parse(deckName) }
        );
        deck.current ??= { id: card.deckId, name: deckName.trim() };
        savedCount.current += 1;
        setBatch((cards) => [...cards, { ...draft, id: card.id }]);
        flash(card.id);
        // The Labels carry over to the next Card.
        loadDraft({ ...EMPTY_DRAFT, labels: draft.labels });
      }
      setSide("question");
      question.commands.focus("end");
      refreshLibrary(queryClient);
      return true;
    } catch {
      toast.error("Não foi possível salvar o Card.");
      return false;
    } finally {
      setSaving(false);
    }
  }, [
    batchEditId,
    deckName,
    editing,
    flash,
    loadDraft,
    navigate,
    queryClient,
    question,
    readDraft,
    validate,
  ]);

  const finish = useCallback(
    async (to: Leave) => {
      setLeaving(null);
      if (editing) {
        await navigate({
          params: { cardId: editing.id },
          to: "/decks/cards/$cardId",
        });
        return;
      }
      if (deck.current) {
        await navigate({
          params: { deckId: deck.current.id },
          to: "/decks/$deckId",
        });
      } else {
        await navigate({ to: "/decks" });
      }
      if (to === "study") {
        notifyStudySoon();
      }
    },
    [editing, navigate]
  );

  const close = useCallback(() => {
    if (isDirty()) {
      setLeaving("close");
    } else {
      finish("close");
    }
  }, [finish, isDirty]);

  // Saves the Card in the editor if it is complete; an incomplete one is discarded after asking.
  const study = useCallback(async () => {
    if (
      (batchEditId || (filled.question && filled.answer)) &&
      !(await save())
    ) {
      return;
    }
    if (savedCount.current === 0) {
      toast("Salve pelo menos um Card para estudar.");
      return;
    }
    if (isDirty()) {
      setLeaving("study");
    } else {
      finish("study");
    }
  }, [batchEditId, filled, finish, isDirty, save]);

  // The main action: on the question side it turns the Card, on the answer side it saves.
  const primary = useCallback(() => {
    if (side === "question") {
      setSide("answer");
    } else {
      save();
    }
  }, [save, side]);

  // Ctrl/Cmd + Enter does the main action, also inside the text (where Tiptap would add a
  // line break), so it is caught before the editor sees it.
  const dialogOpen = formula !== null || leaving !== null || labelsOpen;
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (
        event.key === "Enter" &&
        (event.ctrlKey || event.metaKey) &&
        !dialogOpen
      ) {
        event.preventDefault();
        event.stopPropagation();
        primary();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [dialogOpen, primary]);

  const showSide = useCallback((next: Side) => setSide(next), []);
  const showQuestion = useCallback(() => setSide("question"), []);
  const showAnswer = useCallback(() => setSide("answer"), []);

  const openBatchCard = useCallback(
    (id: string) => {
      const card = batch.find((row) => row.id === id);
      if (!card) {
        return;
      }
      if (!batchEditId) {
        stash.current = readDraft();
      }
      setBatchEditId(id);
      setErrors({});
      loadDraft(card);
      setSide("question");
    },
    [batch, batchEditId, loadDraft, readDraft]
  );
  const backToNew = useCallback(() => {
    setBatchEditId(null);
    setErrors({});
    loadDraft(stash.current ?? EMPTY_DRAFT);
    stash.current = null;
    setSide("question");
  }, [loadDraft]);

  const onDeckName = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setDeckName(event.target.value);
    setErrors((current) => ({ ...current, deck: undefined }));
  }, []);

  const openFormula = useCallback(
    () => setFormula({ latex: "", side }),
    [side]
  );
  const closeFormula = useCallback(() => setFormula(null), []);
  const saveFormula = useCallback(
    (latex: string, target: FormulaTarget) => {
      const editor = editors[formula?.side ?? side];
      if (target.pos === undefined) {
        editor.chain().focus().insertInlineMath({ latex }).run();
      } else if (latex) {
        editor
          .chain()
          .setNodeSelection(target.pos)
          .updateInlineMath({ latex })
          .focus()
          .run();
      } else {
        editor
          .chain()
          .setNodeSelection(target.pos)
          .deleteSelection()
          .focus()
          .run();
      }
      setFormula(null);
    },
    [editors, formula, side]
  );

  const closeLeaving = useCallback(() => setLeaving(null), []);
  const confirmLeaving = useCallback(() => {
    if (leaving) {
      finish(leaving);
    }
  }, [finish, leaving]);

  const editor = editors[side];
  const questionPreview =
    side === "answer" && filled.question
      ? question.getText({ blockSeparator: " " })
      : "";
  const count = batch.length;

  return (
    <div className="min-h-dvh">
      <EditorHeader
        deckName={deck.current?.name}
        mode={mode.kind}
        onClose={close}
        right={
          editing ? (
            <Button
              className="md:h-10 md:px-4 md:text-sm"
              disabled={saving}
              onClick={save}
              size="sm"
            >
              Salvar
            </Button>
          ) : (
            <Button
              className="md:h-10 md:px-4 md:text-sm"
              disabled={saving}
              onClick={study}
              size="sm"
              variant={count ? "default" : "outline"}
            >
              <Play data-icon="inline-start" />
              Estudar agora
              {count ? <span className="tabular-nums">· {count}</span> : null}
            </Button>
          )
        }
      />
      <main className="mx-auto max-w-2xl px-4 pt-4 pb-40 md:pt-8 md:pb-16">
        {mode.kind === "new-deck" && !deck.current ? (
          <DeckNameField
            error={errors.deck}
            inputRef={deckInput}
            onChange={onDeckName}
            value={deckName}
          />
        ) : null}
        {editing ? null : (
          <BatchStrip
            cards={batch}
            editingId={batchEditId}
            flashId={flashId}
            onBackToNew={backToNew}
            onOpen={openBatchCard}
          />
        )}
        <div
          className={cn(
            "mt-3 overflow-hidden rounded-xl border bg-card text-card-foreground shadow-card",
            errors[side] && "border-destructive"
          )}
        >
          <div className="flex justify-center border-b p-2">
            <SideTabs
              errors={errors}
              filled={filled}
              onChange={showSide}
              side={side}
            />
          </div>
          {questionPreview ? (
            <div className="border-b bg-muted/40 px-5 py-3 text-muted-foreground text-sm md:px-8">
              <span className="font-medium text-foreground">Pergunta:</span>{" "}
              <span className="line-clamp-2 inline">{questionPreview}</span>
            </div>
          ) : null}
          {(["question", "answer"] as const).map((key) => (
            <EditorContent
              className={cn(
                "rich-text min-h-[220px] px-5 py-6 text-lg md:min-h-[280px] md:px-8 md:text-xl",
                key !== side && "hidden"
              )}
              editor={editors[key]}
              key={key}
            />
          ))}
          {errors[side] ? (
            <div className="px-5 pb-3 md:px-8">
              <FieldError message={errors[side]} />
            </div>
          ) : null}
          <EditorToolbar editor={editor} onFormula={openFormula} />
        </div>
        <EditorLabels
          carryOver={!(editing || batchEditId)}
          labels={labels}
          onChange={setLabels}
          onOpenChange={setLabelsOpen}
          open={labelsOpen}
        />
        {editing && editing.state !== "new" ? (
          <p className="mt-2 px-1 text-muted-foreground text-xs">
            O agendamento deste Card não muda.
          </p>
        ) : null}
        <EditorAction
          editingSaved={!!(editing || batchEditId)}
          onBack={showQuestion}
          onFlip={showAnswer}
          onSave={save}
          saving={saving}
          side={side}
        />
      </main>
      <FormulaDialog
        onOpenChange={closeFormula}
        onSave={saveFormula}
        target={formula}
      />
      <LeaveDialog
        count={count}
        deckName={deck.current?.name ?? deckName.trim()}
        editMode={!!editing}
        leaving={leaving}
        onCancel={closeLeaving}
        onConfirm={confirmLeaving}
      />
    </div>
  );
}

// "Novo Deck": the name, until the first Card creates the Deck.
function DeckNameField({
  error,
  inputRef,
  onChange,
  value,
}: {
  error?: string;
  inputRef: RefObject<HTMLInputElement | null>;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  value: string;
}) {
  return (
    <div className="mb-5 space-y-1">
      <input
        aria-invalid={!!error}
        aria-label="Nome do Deck"
        autoFocus
        className={cn(
          "w-full border-b bg-transparent pb-2 font-heading font-semibold text-2xl outline-none placeholder:text-muted-foreground/60 focus:border-primary",
          error && "border-destructive"
        )}
        maxLength={80}
        onChange={onChange}
        placeholder="Nome do novo Deck"
        ref={inputRef}
        value={value}
      />
      <FieldError message={error} />
    </div>
  );
}

function LeaveDialog({
  count,
  deckName,
  editMode,
  leaving,
  onCancel,
  onConfirm,
}: {
  count: number;
  deckName: string;
  editMode: boolean;
  leaving: Leave | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  let title = "Sair sem salvar este Card?";
  let body = "O texto do Card em edição será descartado.";
  let confirmLabel = "Descartar e sair";
  if (leaving === "study") {
    title = "Estudar sem o Card incompleto?";
    body =
      "Ele ainda não tem pergunta e resposta, então não entra na sessão. O texto dele será descartado.";
    confirmLabel = "Descartar e estudar";
  } else if (editMode) {
    title = "Descartar as alterações?";
    body = "O Card volta a ficar como estava.";
    confirmLabel = "Descartar";
  } else if (count === 1) {
    body += ` O Card já salvo continua em ${deckName}.`;
  } else if (count > 1) {
    body += ` Os ${count} Cards já salvos continuam em ${deckName}.`;
  }
  return (
    <ConfirmDialog
      body={body}
      cancelLabel="Continuar editando"
      confirmLabel={confirmLabel}
      onConfirm={onConfirm}
      onOpenChange={onCancel}
      open={leaving !== null}
      title={title}
    />
  );
}
