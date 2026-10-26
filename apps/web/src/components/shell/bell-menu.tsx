import type { Today } from "@daruma/shared";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CircleCheck, Coffee, Eye } from "lucide-react";
import { type ReactNode, useCallback, useState } from "react";
import { ReviewDetail, reviewTitle } from "~/components/home/review-strip";
import { useTodayActions } from "~/components/home/use-today-actions";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { openBell } from "~/lib/api";
import { todayQuery } from "~/lib/queries";
import { dayLabel, plural } from "~/lib/schedule";
import { addDays } from "~/lib/today";

const cards = (count: number) => plural(count, "card", "cards");

const clockTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

function Item({
  children,
  detail,
  icon,
  title,
}: {
  children?: ReactNode;
  detail: ReactNode;
  icon: ReactNode;
  title: ReactNode;
}) {
  return (
    <div className="flex gap-3 p-3">
      <span className="mt-0.5">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm">{title}</p>
        <p className="text-muted-foreground text-xs tabular-nums">{detail}</p>
        {children}
      </div>
    </div>
  );
}

// The Daily Review notice. The dot shows from the Review Time until the bell is opened.
export function BellMenu() {
  const { data } = useQuery(todayQuery);
  const today = data?.today;
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  const onOpenChange = useCallback(
    async (next: boolean) => {
      setOpen(next);
      if (next && today?.notice) {
        await openBell();
        await queryClient.invalidateQueries({ queryKey: ["today"] });
      }
    },
    [queryClient, today?.notice]
  );

  return (
    <Popover onOpenChange={onOpenChange} open={open}>
      <PopoverTrigger
        aria-label={
          today?.notice ? "Notificações: revisão de hoje" : "Notificações"
        }
        className="relative grid size-10 place-items-center rounded-full border bg-card hover:bg-accent"
      >
        <Bell className="size-[18px]" />
        {today?.notice ? (
          <span className="absolute -top-0.5 -right-0.5 size-3 rounded-full bg-primary ring-2 ring-background" />
        ) : null}
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 max-w-[calc(100vw-1.5rem)] gap-0 p-0 shadow-pop"
      >
        <div className="border-b px-4 py-3 font-medium text-sm">
          Notificações
        </div>
        {today ? (
          <Notices close={close} today={today} />
        ) : (
          <Nothing detail="Carregando…" />
        )}
      </PopoverContent>
    </Popover>
  );
}

function Nothing({ detail }: { detail: string }) {
  return (
    <div className="flex gap-3 p-5 text-muted-foreground">
      <Bell className="mt-0.5 size-4 shrink-0" />
      <div>
        <p className="font-medium text-foreground text-sm">
          Nada por aqui ainda
        </p>
        <p className="text-xs tabular-nums">{detail}</p>
      </div>
    </div>
  );
}

function Notices({ close, today }: { close: () => void; today: Today }) {
  const { seen, study } = useTodayActions();
  const start = useCallback(() => {
    close();
    study();
  }, [close, study]);
  const markSeen = useCallback(() => {
    close();
    seen();
  }, [close, seen]);

  // Before the first Rating, and on the first Day once it is done, there is no notice yet.
  if (today.status !== "open" && !today.hasRatings) {
    return (
      <Nothing
        detail={`O aviso da revisão de hoje aparece aqui às ${today.reviewTime}, quando houver Cards.`}
      />
    );
  }
  if (today.firstDay && today.status === "completed" && today.tomorrow) {
    return (
      <Nothing
        detail={`Amanhã às ${today.reviewTime}: aviso da revisão de ${cards(today.tomorrow)}.`}
      />
    );
  }

  return (
    <div className="space-y-1 p-2">
      {today.status === "open" ? (
        <div className="flex gap-3 rounded-md bg-accent/70 p-3">
          <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm tabular-nums">
              {reviewTitle(today)}
            </p>
            <p className="text-muted-foreground text-xs tabular-nums">
              <ReviewDetail today={today} /> · às {today.reviewTime}
            </p>
            <div className="mt-3 flex gap-2">
              <Button onClick={start} size="sm">
                {today.done ? "Continuar" : "Começar"}
              </Button>
              <Button onClick={markSeen} size="sm" variant="ghost">
                Marcar como vista
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <ClosedDay today={today} />
      )}
      {today.yesterday ? (
        <div className="text-muted-foreground">
          <Item
            detail={dayLabel(addDays(today.day, -1))}
            icon={
              today.yesterday === "completed" ? (
                <CircleCheck className="size-4" />
              ) : (
                <Eye className="size-4" />
              )
            }
            title={
              <span className="font-normal">
                {today.yesterday === "completed"
                  ? "Ontem: revisão concluída"
                  : "Ontem: revisão marcada como vista"}
              </span>
            }
          />
        </div>
      ) : null}
    </div>
  );
}

function ClosedDay({ today }: { today: Today }) {
  switch (today.status) {
    case "completed":
      return (
        <Item
          detail={`${cards(today.done)}${today.completedAt ? ` · às ${clockTime(today.completedAt)}` : ""}`}
          icon={<CircleCheck className="size-4 text-success" />}
          title="Revisão de hoje concluída"
        />
      );
    case "seen":
      return (
        <Item
          detail={`${plural(today.remaining, "card fica", "cards ficam")} para amanhã`}
          icon={<Eye className="size-4 text-muted-foreground" />}
          title="Revisão de hoje marcada como vista"
        />
      );
    default:
      return (
        <Item
          detail={
            today.tomorrow ? `Amanhã: ${cards(today.tomorrow)}` : "Tudo em dia"
          }
          icon={<Coffee className="size-4 text-muted-foreground" />}
          title="Nada para revisar hoje"
        />
      );
  }
}
