import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";
import { toast } from "sonner";
import { markSeen, updateSettings } from "~/lib/api";
import { clearStudy } from "~/lib/study-storage";

// The actions on today's Daily Review, shared by the strip on Início and the bell.
export function useTodayActions() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const refresh = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ["today"] }),
    [queryClient]
  );

  // Começar, Continuar and "Revisar mesmo assim": a fresh Study Session of what is left.
  const study = useCallback(() => {
    clearStudy();
    navigate({ search: { origem: "daily" }, to: "/estudar" });
  }, [navigate]);

  const seen = useCallback(async () => {
    try {
      await markSeen(true);
    } catch {
      toast.error("Não foi possível marcar a revisão como vista.");
      return;
    }
    await refresh();
    toast.success("Revisão marcada como vista. Sem avisos até amanhã.", {
      action: {
        label: "Desfazer",
        onClick: async () => {
          await markSeen(false);
          await refresh();
        },
      },
    });
  }, [refresh]);

  const pauseNew = useCallback(
    async (paused: boolean) => {
      try {
        await updateSettings({ newCardsPaused: paused });
      } catch {
        toast.error(
          paused
            ? "Não foi possível pausar os Cards novos."
            : "Não foi possível retomar os Cards novos."
        );
        return;
      }
      await refresh();
      if (paused) {
        toast.success("Cards novos pausados até você pôr a revisão em dia.");
      }
    },
    [refresh]
  );

  return { pauseNew, seen, study };
}
