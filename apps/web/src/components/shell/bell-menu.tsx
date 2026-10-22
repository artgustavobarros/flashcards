import { Bell } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";

// The Daily Review notice lands here once there is a Daily Review to announce.
export function BellMenu() {
  return (
    <Popover>
      <PopoverTrigger
        aria-label="Notificações"
        className="relative grid size-10 place-items-center rounded-full border bg-card hover:bg-accent"
      >
        <Bell className="size-[18px]" />
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 max-w-[calc(100vw-1.5rem)] gap-0 p-0 shadow-pop"
      >
        <div className="border-b px-4 py-3 font-medium text-sm">
          Notificações
        </div>
        <div className="flex gap-3 p-5 text-muted-foreground">
          <Bell className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-medium text-foreground text-sm">
              Nada por aqui ainda
            </p>
            <p className="text-xs">
              O aviso da revisão de hoje aparece aqui quando houver Cards.
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
