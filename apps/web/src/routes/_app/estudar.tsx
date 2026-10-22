import type { StudyQueueBody } from "@daruma/shared";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, MessageSquare, Pencil, RotateCcw, X } from "lucide-react";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { z } from "zod";
import { CardComments } from "~/components/cards/card-comments";
import { ConfirmDialog } from "~/components/confirm-dialog";
import { RichTextView } from "~/components/rich-text/rich-text-view";
import { Button } from "~/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "~/components/ui/sheet";
import { useMediaQuery } from "~/hooks/use-media-query";
import { getCard, getStudyQueue, rateCard, undoReview } from "~/lib/api";
import { commentsQuery, refreshLibrary } from "~/lib/queries";
import { plural } from "~/lib/schedule";
import {
  applyRating,
  createStudySession,
  studyCounts,
  undoRating,
} from "~/lib/study-session";
import {
  clearStudy,
  readStudy,
  type StoredStudy,
  studyScope,
  takeStudySaved,
  writeStudy,
} from "~/lib/study-storage";

const searchSchema = z.object({
  deckId: z.uuid().optional(),
  origem: z.enum(["daily", "deck", "batch"]).catch("daily"),
});

export const Route = createFileRoute("/_app/estudar")({
  component: StudyPage,
  head: () => ({ meta: [{ title: "Study Session · Daruma" }] }),
  staticData: { focus: true, title: "Study Session" },
  validateSearch: searchSchema,
});

const RATINGS = [
  { label: "Errei", value: 1 },
  { label: "Difícil", value: 2 },
  { label: "Bom", value: 3 },
  { label: "Fácil", value: 4 },
] as const;
const RATING_KEYS = /^[1-4]$/;
const RATING_TONE: Record<number, string> = {
  1: "bg-destructive",
  2: "bg-warning",
  3: "bg-primary",
  4: "bg-primary/50",
};
const RATING_TEXT: Record<number, string> = {
  1: "text-destructive",
  2: "text-warning",
  3: "",
  4: "",
};

function destination(study: StoredStudy) {
  if (study.scope.origin === "daily") {
    return "/";
  }
  const deckId =
    study.scope.origin === "deck" ? study.scope.deckId : study.cards[0]?.deckId;
  return deckId ? `/decks/${deckId}` : "/decks";
}

function stateBadge(
  card: StoredStudy["cards"][number],
  repeated: boolean,
  today: string
) {
  if (repeated) {
    return (
      <span className="rounded-full bg-warning/15 px-2.5 py-0.5 text-warning">
        De novo
      </span>
    );
  }
  if (card.state === "new") {
    return (
      <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-primary">
        Novo
      </span>
    );
  }
  if (card.due && card.due < today) {
    return (
      <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-destructive">
        Atrasado
      </span>
    );
  }
  return null;
}

function summaryCopy(origin: StoredStudy["scope"]["origin"], deckName: string) {
  if (origin === "daily") {
    return {
      title: "Revisão de hoje concluída",
      description: "Os Cards de hoje receberam Rating.",
    };
  }
  if (origin === "deck") {
    return {
      title: `${deckName} em dia`,
      description: "Os Cards deste Deck que venciam hoje já foram revisados.",
    };
  }
  return {
    title: "Cards novos estudados",
    description: "Eles entraram no agendamento normal.",
  };
}

const initial = (scope: StudyQueueBody | null) => {
  const stored = readStudy();
  return scope && JSON.stringify(stored?.scope) === JSON.stringify(scope)
    ? stored
    : null;
};

function exitMessage(study: StoredStudy) {
  const pending = study.session.queue.length;
  const rest =
    study.scope.origin === "batch"
      ? "Os demais continuam como Cards novos e entram nas próximas Daily Reviews."
      : "Os demais continuam na revisão de hoje.";
  return `${plural(pending, "Card pendente", "Cards pendentes")}. Os Ratings dados ficam salvos. ${rest}`;
}

function StudyPage() {
  const { deckId, origem } = Route.useSearch();
  const scope = studyScope(origem, deckId);
  const [study, setStudy] = useState<StoredStudy | null>(() => initial(scope));
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const isMobile = useMediaQuery("(max-width: 767px)");
  const shownAt = useRef(Date.now());
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const queue = useQuery({
    enabled: !!scope && !study,
    queryFn: () => getStudyQueue(scope as StudyQueueBody),
    queryKey: ["study-queue", scope],
    retry: false,
  });

  useEffect(() => {
    if (!study && queue.data && scope) {
      const next = {
        cards: queue.data.cards,
        scope,
        session: createStudySession(
          queue.data.cards.map((row) => row.id),
          scope.origin
        ),
        today: queue.data.today,
      };
      writeStudy(next);
      setStudy(next);
    }
  }, [queue.data, scope, study]);

  useEffect(() => {
    if (study && takeStudySaved()) {
      const [id] = study.session.queue;
      if (id) {
        getCard(id)
          .then(({ card: savedCard }) => {
            const next = {
              ...study,
              cards: study.cards.map((row) =>
                row.id === id ? savedCard : row
              ),
            };
            writeStudy(next);
            setStudy(next);
          })
          .catch(() => toast.error("Não foi possível atualizar o Card."));
      }
    }
  }, [study]);

  const currentId = study?.session.queue[0];
  const card = study?.cards.find((row) => row.id === currentId);
  const comments = useQuery({
    ...commentsQuery(card?.id ?? ""),
    enabled: !!card,
  });
  // biome-ignore lint/correctness/useExhaustiveDependencies: A new Card starts a new duration timer.
  useEffect(() => {
    shownAt.current = Date.now();
  }, [currentId]);

  const update = useCallback((next: StoredStudy) => {
    writeStudy(next);
    setStudy(next);
  }, []);

  const back = useCallback(async () => {
    if (!study) {
      await navigate({ to: "/decks" });
      return;
    }
    clearStudy();
    await refreshLibrary(queryClient);
    await navigate({ href: destination(study) });
  }, [navigate, queryClient, study]);

  const exit = useCallback(() => {
    if (study?.session.queue.length && study.session.history.length) {
      setExitOpen(true);
    } else {
      back();
    }
  }, [back, study]);

  const reveal = useCallback(() => {
    if (study && !study.session.revealed) {
      update({ ...study, session: { ...study.session, revealed: true } });
    }
  }, [study, update]);

  const rate = useCallback(
    async (rating: 1 | 2 | 3 | 4) => {
      if (!(study && currentId && study.session.revealed) || pending) {
        return;
      }
      setPending(true);
      try {
        const result = await rateCard(currentId, {
          durationMs: Math.min(43_200_000, Date.now() - shownAt.current),
          rating,
        });
        update({
          ...study,
          session: applyRating(
            study.session,
            currentId,
            rating,
            result.reviewId,
            result.due
          ),
        });
        await refreshLibrary(queryClient);
      } catch {
        toast.error("Não foi possível salvar o Rating.");
      } finally {
        setPending(false);
      }
    },
    [currentId, pending, queryClient, study, update]
  );

  const undo = useCallback(async () => {
    const last = study?.session.history.at(-1);
    if (!last || pending || !study) {
      return;
    }
    setPending(true);
    try {
      await undoReview(last.reviewId);
      update({ ...study, session: undoRating(study.session) });
      await refreshLibrary(queryClient);
    } catch {
      toast.error("Não foi possível desfazer o Rating.");
    } finally {
      setPending(false);
    }
  }, [pending, queryClient, study, update]);

  const edit = useCallback(() => {
    if (currentId) {
      navigate({
        params: { cardId: currentId },
        search: { de: "sessao" },
        to: "/decks/cards/$cardId/editar",
      });
    }
  }, [currentId, navigate]);

  const reviewOthers = useCallback(() => {
    clearStudy();
    setStudy(null);
    navigate({ search: { origem: "daily" }, to: "/estudar" });
  }, [navigate]);

  const retry = useCallback(() => queue.refetch(), [queue.refetch]);
  const openComments = useCallback(() => setCommentsOpen(true), []);
  const closeComments = useCallback(() => setCommentsOpen(false), []);

  useEffect(() => {
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Each key has one Study Session action.
    const keydown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (
        event.repeat ||
        target.closest("button, input, textarea, [contenteditable='true']")
      ) {
        return;
      }
      if (event.key === "Escape") {
        if (commentsOpen) {
          setCommentsOpen(false);
        } else {
          exit();
        }
      } else if (event.key.toLowerCase() === "c" && card) {
        setCommentsOpen((open) => !open);
      } else if (
        card &&
        study?.session.revealed &&
        RATING_KEYS.test(event.key)
      ) {
        rate(Number(event.key) as 1 | 2 | 3 | 4);
      } else if (
        card &&
        !study?.session.revealed &&
        (event.key === " " || event.key === "Enter")
      ) {
        event.preventDefault();
        reveal();
      }
    };
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [card, commentsOpen, exit, rate, reveal, study?.session.revealed]);

  if (!scope) {
    return (
      <StateMessage
        action={
          <Button asChild>
            <Link to="/decks">Voltar aos Decks</Link>
          </Button>
        }
        title="Sessão não encontrada"
      />
    );
  }
  if (!study) {
    return (
      <StateMessage
        action={
          queue.isError ? <Button onClick={retry}>Tentar de novo</Button> : null
        }
        title={
          queue.isError
            ? "Não foi possível carregar a sessão"
            : "Preparando a sessão…"
        }
      />
    );
  }
  if (!card) {
    return (
      <Summary onBack={back} onReviewOthers={reviewOthers} study={study} />
    );
  }

  const counts = studyCounts(study.session, study.cards);
  const done = study.session.finished.length;
  const total = study.session.ids.length;
  const repeated = card.id in study.session.first;

  return (
    <div className="flex h-dvh overflow-hidden">
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="shrink-0">
          <div className="mx-auto flex h-14 max-w-3xl items-center gap-1 px-2 md:px-4">
            <Button
              aria-label="Sair da sessão"
              onClick={exit}
              size="icon"
              variant="ghost"
            >
              <X />
            </Button>
            <div className="mx-2 flex flex-1 items-center gap-3">
              <div
                aria-label={`${done} de ${total} Cards concluídos`}
                aria-valuemax={total}
                aria-valuemin={0}
                aria-valuenow={done}
                className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
                role="progressbar"
              >
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${total ? (done / total) * 100 : 0}%` }}
                />
              </div>
              <span className="text-muted-foreground text-sm tabular-nums">
                {done}/{total}
              </span>
            </div>
            <Button
              aria-label="Desfazer o último Rating"
              disabled={!study.session.history.length || pending}
              onClick={undo}
              size="icon"
              variant="ghost"
            >
              <RotateCcw />
            </Button>
            <Button
              aria-label="Editar Card"
              onClick={edit}
              size="icon"
              variant="ghost"
            >
              <Pencil />
            </Button>
            <Button
              aria-label="Comments do Card"
              onClick={openComments}
              size="sm"
              variant={commentsOpen ? "secondary" : "ghost"}
            >
              <MessageSquare className="size-4" />
              {comments.data?.comments.length || null}
            </Button>
          </div>
          <div className="flex justify-center gap-4 pb-1 font-medium text-xs">
            <span className="text-primary">{counts.new} novos</span>
            <span className="text-muted-foreground">
              {counts.review} revisões
            </span>
            <span className="text-warning">{counts.repeat} de novo</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto" key={card.id}>
          <div className="mx-auto w-full max-w-2xl px-5 pt-6 pb-8 md:pt-12">
            <div className="flex items-center gap-2 font-medium text-xs">
              {study.scope.origin === "daily" ? (
                <span className="text-muted-foreground">{card.deckName}</span>
              ) : null}
              {stateBadge(card, repeated, study.today)}
            </div>
            <RichTextView
              className="mt-3 font-heading font-medium text-2xl leading-snug md:text-3xl"
              doc={card.question}
            />
            {study.session.revealed ? (
              <div>
                <div className="my-6 flex items-center gap-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
                  <span className="h-px flex-1 bg-border" />
                  Resposta
                  <span className="h-px flex-1 bg-border" />
                </div>
                <RichTextView
                  className="text-lg leading-relaxed md:text-xl"
                  doc={card.answer}
                />
              </div>
            ) : null}
          </div>
        </main>
        <footer className="shrink-0 px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] md:pb-12">
          <div className="mx-auto max-w-2xl">
            {study.session.revealed ? (
              <>
                <div className="grid grid-cols-2 gap-2 min-[340px]:grid-cols-4">
                  {RATINGS.map(({ label, value }) => (
                    <RatingButton
                      disabled={pending}
                      key={value}
                      label={label}
                      onRate={rate}
                      value={value}
                    />
                  ))}
                </div>
                {repeated ? (
                  <p className="mt-3 text-center text-muted-foreground text-xs">
                    Você errou este Card há pouco. Ele já volta amanhã; agora é
                    só para fixar.
                  </p>
                ) : null}
              </>
            ) : (
              <Button className="h-14 w-full" onClick={reveal}>
                Mostrar resposta
              </Button>
            )}
          </div>
        </footer>
      </div>
      {commentsOpen ? (
        <aside className="hidden w-96 shrink-0 flex-col border-l bg-card p-4 md:flex">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading font-semibold text-lg">Comments</h2>
              <p className="line-clamp-1 text-muted-foreground text-xs">
                {card.questionText}
              </p>
            </div>
            <Button
              aria-label="Fechar Comments"
              onClick={closeComments}
              size="icon"
              variant="ghost"
            >
              <X />
            </Button>
          </div>
          <CardComments cardId={card.id} embedded key={card.id} />
        </aside>
      ) : null}
      {isMobile ? (
        <Sheet onOpenChange={setCommentsOpen} open={commentsOpen}>
          <SheetContent
            className="max-h-[75dvh] min-h-[45dvh] rounded-t-xl md:hidden"
            side="bottom"
          >
            <SheetTitle>Comments</SheetTitle>
            <SheetDescription className="line-clamp-1">
              {card.questionText}
            </SheetDescription>
            <CardComments cardId={card.id} embedded key={card.id} />
          </SheetContent>
        </Sheet>
      ) : null}
      <ConfirmDialog
        body={exitMessage(study)}
        cancelLabel="Continuar estudando"
        confirmLabel="Sair"
        onConfirm={back}
        onOpenChange={setExitOpen}
        open={exitOpen}
        title="Sair da sessão?"
      />
    </div>
  );
}

function StateMessage({ title, action }: { title: string; action: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-5 text-center">
      <h1 className="font-heading font-semibold text-xl">{title}</h1>
      {action}
    </div>
  );
}

function RatingButton({
  disabled,
  label,
  onRate,
  value,
}: {
  disabled: boolean;
  label: string;
  onRate: (value: 1 | 2 | 3 | 4) => void;
  value: 1 | 2 | 3 | 4;
}) {
  const choose = useCallback(() => onRate(value), [onRate, value]);
  return (
    <Button
      className={`h-14 min-w-0 rounded-xl font-semibold ${RATING_TEXT[value]}`}
      disabled={disabled}
      onClick={choose}
      variant={value === 3 ? "default" : "outline"}
    >
      {label}
    </Button>
  );
}

function Summary({
  study,
  onBack,
  onReviewOthers,
}: {
  study: StoredStudy;
  onBack: () => void;
  onReviewOthers: () => void;
}) {
  const ratings = RATINGS.map(({ label, value }) => ({
    label,
    value,
    count: Object.values(study.session.first).filter(
      (rating) => rating === value
    ).length,
  }));
  const total = study.session.ids.length;
  const [again] = ratings;
  const correct = total - (again?.count ?? 0);
  const minutes = Math.round((Date.now() - study.session.startedAt) / 60_000);
  const upcoming = Object.values(study.session.due)
    .filter((day): day is string => !!day)
    .sort();
  const [firstDay] = upcoming;
  const nextCount = upcoming.filter((day) => day === firstDay).length;
  const nextText = firstDay
    ? new Intl.DateTimeFormat("pt-BR", {
        day: "numeric",
        month: "short",
        timeZone: "UTC",
      }).format(new Date(`${firstDay}T00:00:00Z`))
    : null;
  const deckName = study.cards[0]?.deckName ?? "Deck";
  const { title, description } = summaryCopy(study.scope.origin, deckName);
  const others = useQuery({
    enabled: study.scope.origin === "deck",
    queryFn: () => getStudyQueue({ origin: "daily" }),
    queryKey: ["study-queue", "others", study.scope],
  });
  const currentDeckId =
    study.scope.origin === "deck" ? study.scope.deckId : null;
  const otherCount = currentDeckId
    ? (others.data?.cards.filter((card) => card.deckId !== currentDeckId)
        .length ?? 0)
    : 0;
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-14 items-center px-2 md:px-4">
        <Button
          aria-label="Voltar"
          onClick={onBack}
          size="icon"
          variant="ghost"
        >
          <X />
        </Button>
      </header>
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-5 pb-8">
        <div className="grid size-14 place-items-center rounded-full bg-primary/10 text-primary">
          <Check className="size-7" />
        </div>
        <h1 className="mt-4 font-heading font-semibold text-3xl leading-tight">
          {title}
        </h1>
        <p className="mt-1 text-muted-foreground">{description}</p>
        <div className="mt-6 grid grid-cols-3 gap-2 text-center">
          <SummaryStat label={total === 1 ? "Card" : "Cards"} value={total} />
          <SummaryStat
            label="certos de primeira"
            value={`${correct}/${total}`}
          />
          <SummaryStat
            label="de estudo"
            value={minutes < 1 ? "< 1 min" : `${minutes} min`}
          />
        </div>
        <div className="mt-4 rounded-xl border bg-card p-4 shadow-card">
          <p className="font-medium text-sm">Primeiro Rating de cada Card</p>
          <div className="mt-3 flex h-2.5 gap-0.5 overflow-hidden rounded-full">
            {ratings
              .filter((r) => r.count)
              .map((r) => (
                <span
                  className={RATING_TONE[r.value]}
                  key={r.value}
                  style={{ flex: r.count }}
                />
              ))}
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2 text-xs">
            {ratings.map((r) => (
              <div key={r.value}>
                <span
                  className={`inline-block size-2 rounded-full ${RATING_TONE[r.value]}`}
                />{" "}
                {r.label}
                <p className="font-semibold text-base tabular-nums">
                  {r.count}
                </p>
              </div>
            ))}
          </div>
        </div>
        {nextText ? (
          <p className="mt-4 rounded-xl border bg-card p-4 text-sm shadow-card">
            Próxima revisão destes Cards: <strong>{nextText}</strong>,{" "}
            {plural(nextCount, "Card", "Cards")}.
          </p>
        ) : null}
        {otherCount > 0 ? (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-dashed p-4">
            <p className="flex-1 text-sm">
              A revisão de hoje ainda tem {plural(otherCount, "Card", "Cards")}{" "}
              em outros Decks.
            </p>
            <Button onClick={onReviewOthers} size="sm" variant="outline">
              Revisar
            </Button>
          </div>
        ) : null}
        <div className="mt-auto pt-8 pb-8">
          <Button className="w-full" onClick={onBack}>
            {study.scope.origin === "daily"
              ? "Voltar ao Início"
              : "Voltar ao Deck"}
          </Button>
        </div>
      </main>
    </div>
  );
}

function SummaryStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border bg-card p-3 shadow-card">
      <p className="font-heading font-semibold text-2xl tabular-nums">
        {value}
      </p>
      <p className="text-muted-foreground text-xs">{label}</p>
    </div>
  );
}
