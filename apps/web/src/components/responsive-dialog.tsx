import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";
import { useMediaQuery } from "~/hooks/use-media-query";

// Centered dialog from sm up, bottom sheet below it (as in prototype/decks.html).
export function ResponsiveDialog({
  children,
  description,
  onOpenChange,
  open,
  title,
}: {
  children: ReactNode;
  description?: ReactNode;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  title: ReactNode;
}) {
  const isSheet = useMediaQuery("(max-width: 639px)");

  if (isSheet) {
    return (
      <Sheet onOpenChange={onOpenChange} open={open}>
        <SheetContent
          className="max-h-[85dvh] gap-0 rounded-t-xl pb-[env(safe-area-inset-bottom)]"
          side="bottom"
        >
          <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-border" />
          <SheetHeader className="px-5 pt-3 pb-3">
            <SheetTitle className="font-heading text-lg">{title}</SheetTitle>
            <SheetDescription className={description ? "" : "sr-only"}>
              {description ?? title}
            </SheetDescription>
          </SheetHeader>
          <div className="flex min-h-0 flex-col px-5 pb-5">{children}</div>
        </SheetContent>
      </Sheet>
    );
  }
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[85dvh] gap-0 p-0 shadow-pop sm:max-w-md">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="font-heading text-lg">{title}</DialogTitle>
          <DialogDescription className={description ? "" : "sr-only"}>
            {description ?? title}
          </DialogDescription>
        </DialogHeader>
        <div className="flex min-h-0 flex-col px-5 pb-5">{children}</div>
      </DialogContent>
    </Dialog>
  );
}

// The footer row of a dialog: actions on the right, stacked on mobile with the main one on top.
export function DialogActions({ children }: { children: ReactNode }) {
  return (
    <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      {children}
    </div>
  );
}
