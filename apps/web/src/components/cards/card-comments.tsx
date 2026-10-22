import type { Comment } from "@daruma/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SendHorizontal } from "lucide-react";
import {
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
  type MouseEvent,
  useCallback,
  useState,
} from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
  createComment,
  deleteComment,
  restoreComment,
  updateComment,
} from "~/lib/api";
import { commentsQuery, refreshLibrary } from "~/lib/queries";

const MONTHS = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

// "Hoje · 19:40", "3 out · 19:40", or with the year when it isn't this one. Device time.
function commentTime(iso: string, now = new Date()) {
  const date = new Date(iso);
  const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  if (date.toDateString() === now.toDateString()) {
    return `Hoje · ${time}`;
  }
  const year =
    date.getFullYear() === now.getFullYear() ? "" : ` ${date.getFullYear()}`;
  return `${date.getDate()} ${MONTHS[date.getMonth()]}${year} · ${time}`;
}

// Enter saves, Shift+Enter breaks the line.
function submitOnEnter(event: KeyboardEvent<HTMLTextAreaElement>) {
  if (
    event.key === "Enter" &&
    !event.shiftKey &&
    !event.nativeEvent.isComposing
  ) {
    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  }
}

const textarea =
  "w-full resize-none bg-transparent text-base outline-none placeholder:text-muted-foreground [field-sizing:content] md:text-sm";

// The Comments at the end of the Card page: oldest on top, edited in place, the field below.
export function CardComments({
  cardId,
  embedded = false,
}: {
  cardId: string;
  embedded?: boolean;
}) {
  const queryClient = useQueryClient();
  const comments = useQuery(commentsQuery(cardId)).data?.comments;
  const [editingId, setEditingId] = useState<string | null>(null);

  const remove = useMutation({
    mutationFn: (comment: Comment) => deleteComment(comment.id),
    onError: () => toast.error("Não foi possível apagar o Comment."),
    onSuccess: async (_, comment) => {
      await refreshLibrary(queryClient);
      toast.success("Comment apagado.", {
        action: {
          label: "Desfazer",
          onClick: async () => {
            await restoreComment(comment.id);
            await refreshLibrary(queryClient);
          },
        },
      });
    },
  });

  // Each item's buttons carry data-comment-id so one handler serves the list.
  const startEdit = useCallback(
    (event: MouseEvent<HTMLButtonElement>) =>
      setEditingId(event.currentTarget.dataset.commentId ?? null),
    []
  );
  const stopEdit = useCallback(() => setEditingId(null), []);
  const { mutate: removeComment } = remove;
  const onRemove = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      const { commentId } = event.currentTarget.dataset;
      const comment = comments?.find((row) => row.id === commentId);
      if (comment) {
        setEditingId(null);
        removeComment(comment);
      }
    },
    [comments, removeComment]
  );

  return (
    <section
      className={embedded ? "flex min-h-0 flex-1 flex-col pt-4" : "mt-8"}
    >
      {embedded ? null : (
        <h3 className="mb-3 font-heading font-semibold text-lg">
          Comments{" "}
          {comments?.length ? (
            <span className="text-muted-foreground tabular-nums">
              {comments.length}
            </span>
          ) : null}
        </h3>
      )}
      {comments?.length ? (
        <ol
          className={
            embedded
              ? "min-h-0 flex-1 space-y-2.5 overflow-y-auto"
              : "space-y-2.5"
          }
        >
          {comments.map((comment) =>
            comment.id === editingId ? (
              <li key={comment.id}>
                <EditComment comment={comment} onDone={stopEdit} />
              </li>
            ) : (
              <li
                className="group rounded-lg bg-muted/60 px-3.5 py-2.5"
                key={comment.id}
              >
                <p className="whitespace-pre-wrap break-words text-sm">
                  {comment.body}
                </p>
                <div className="mt-1 flex items-center gap-3 text-muted-foreground text-xs">
                  <span>{commentTime(comment.createdAt)}</span>
                  <span className="ml-auto flex gap-3 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
                    <button
                      className="hover:text-foreground"
                      data-comment-id={comment.id}
                      onClick={startEdit}
                      type="button"
                    >
                      Editar
                    </button>
                    <button
                      className="hover:text-destructive"
                      data-comment-id={comment.id}
                      onClick={onRemove}
                      type="button"
                    >
                      Apagar
                    </button>
                  </span>
                </div>
              </li>
            )
          )}
        </ol>
      ) : null}
      {comments && !comments.length ? (
        <p
          className={
            embedded
              ? "flex flex-1 items-center justify-center rounded-lg border border-dashed px-4 py-6 text-center text-muted-foreground text-sm"
              : "rounded-lg border border-dashed px-4 py-6 text-center text-muted-foreground text-sm"
          }
        >
          Nenhum Comment ainda. Anote uma dica, uma fonte ou o que confundiu
          você.
        </p>
      ) : null}
      <NewComment cardId={cardId} />
    </section>
  );
}

function NewComment({ cardId }: { cardId: string }) {
  const queryClient = useQueryClient();
  const [body, setBody] = useState("");
  const create = useMutation({
    mutationFn: (text: string) => createComment(cardId, text),
    onError: () => toast.error("Não foi possível salvar o Comment."),
    onSuccess: async () => {
      setBody("");
      await refreshLibrary(queryClient);
      toast.success("Comment salvo.");
    },
  });

  const onBody = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => setBody(event.target.value),
    []
  );
  const { isPending, mutate } = create;
  const submit = useCallback(
    (event: FormEvent) => {
      event.preventDefault();
      if (body.trim() && !isPending) {
        mutate(body.trim());
      }
    },
    [body, isPending, mutate]
  );

  return (
    <form className="mt-3 flex items-end gap-2" onSubmit={submit}>
      <textarea
        aria-label="Novo Comment"
        className={`${textarea} max-h-48 min-h-10 rounded-[1.25rem] border border-input bg-background px-4 py-2.5 focus-visible:ring-2 focus-visible:ring-ring`}
        maxLength={2000}
        onChange={onBody}
        onKeyDown={submitOnEnter}
        placeholder="Escreva um Comment…"
        rows={1}
        value={body}
      />
      <Button
        aria-label="Salvar Comment"
        disabled={!body.trim() || isPending}
        size="icon"
        type="submit"
      >
        <SendHorizontal />
      </Button>
    </form>
  );
}

function EditComment({
  comment,
  onDone,
}: {
  comment: Comment;
  onDone: () => void;
}) {
  const queryClient = useQueryClient();
  const [body, setBody] = useState(comment.body);
  const update = useMutation({
    mutationFn: (text: string) => updateComment(comment.id, text),
    onError: () => toast.error("Não foi possível salvar o Comment."),
    onSuccess: async () => {
      await refreshLibrary(queryClient);
      onDone();
      toast.success("Comment salvo.");
    },
  });

  const onBody = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => setBody(event.target.value),
    []
  );
  const { isPending, mutate } = update;
  const submit = useCallback(
    (event: FormEvent) => {
      event.preventDefault();
      if (body.trim() && !isPending) {
        mutate(body.trim());
      }
    },
    [body, isPending, mutate]
  );

  return (
    <form className="rounded-lg border bg-background p-2" onSubmit={submit}>
      <textarea
        aria-label="Editar Comment"
        autoFocus
        className={`${textarea} min-h-16 px-1.5 py-1`}
        maxLength={2000}
        onChange={onBody}
        onKeyDown={submitOnEnter}
        value={body}
      />
      <div className="flex justify-end gap-2">
        <Button onClick={onDone} size="sm" type="button" variant="ghost">
          Cancelar
        </Button>
        <Button disabled={!body.trim() || isPending} size="sm" type="submit">
          Salvar
        </Button>
      </div>
    </form>
  );
}
