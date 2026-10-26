import type { Settings, SettingsBody } from "@daruma/shared";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Check, Minus, Plus } from "lucide-react";
import { useTheme } from "next-themes";
import {
  type ChangeEvent,
  type MouseEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import { toast } from "sonner";
import {
  DialogActions,
  ResponsiveDialog,
} from "~/components/responsive-dialog";
import { SettingsOverview } from "~/components/settings/settings-overview";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { Switch } from "~/components/ui/switch";
import { deleteAccount, updateSettings } from "~/lib/api";
import { authClient, sessionQuery } from "~/lib/auth";
import { settingsQuery } from "~/lib/queries";
import { timezoneLabel } from "~/lib/settings";

export const Route = createFileRoute("/_app/configuracoes")({
  loader: ({ context }) => context.queryClient.ensureQueryData(settingsQuery),
  head: () => ({ meta: [{ title: "Configurações · Daruma" }] }),
  component: Page,
  staticData: { title: "Configurações" },
});

type Editor =
  | "reviewTime"
  | "timezone"
  | "newCardsPerDay"
  | "theme"
  | "name"
  | "delete"
  | null;

const ZONES = [
  ["America/Sao_Paulo", "Horário de Brasília"],
  ["America/Manaus", "Amazonas"],
  ["America/Rio_Branco", "Acre"],
  ["America/Noronha", "Fernando de Noronha"],
  ["Europe/Lisbon", "Lisboa"],
  ["America/New_York", "Nova York"],
] as const;

const THEMES = [
  ["light", "Claro", "Sempre claro"],
  ["dark", "Escuro", "Sempre escuro"],
  ["system", "Sistema", "Segue o aparelho"],
] as const;

function themeNameFrom(theme: Settings["theme"]) {
  return THEMES.find(([value]) => value === theme)?.[1] ?? "Sistema";
}

function Page() {
  const settingsQueryResult = useQuery(settingsQuery);
  const session = useQuery(sessionQuery).data;
  const settings = settingsQueryResult.data?.settings;
  const queryClient = useQueryClient();
  const router = useRouter();
  const { setTheme } = useTheme();
  const [editor, setEditor] = useState<Editor>(null);
  const [time, setTime] = useState("19:00");
  const [timezone, setTimezone] = useState("America/Sao_Paulo");
  const [timezoneAuto, setTimezoneAuto] = useState(true);
  const [newCardsPerDay, setNewCardsPerDay] = useState(20);
  const [themeDraft, setThemeDraft] = useState<Settings["theme"]>("system");
  const [nameDraft, setNameDraft] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const retrySettings = useCallback(
    () => settingsQueryResult.refetch(),
    [settingsQueryResult.refetch]
  );

  useEffect(() => {
    if (!settings?.timezoneAuto) {
      return;
    }
    const deviceTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!deviceTimezone || deviceTimezone === settings.timezone) {
      return;
    }
    updateSettings({ timezone: deviceTimezone })
      .then(() => queryClient.invalidateQueries({ queryKey: ["settings"] }))
      .catch(() =>
        toast.error("Não foi possível atualizar o fuso do aparelho.")
      );
  }, [queryClient, settings]);

  useEffect(() => {
    if (settings) {
      setTheme(settings.theme);
    }
  }, [setTheme, settings]);

  const save = useCallback(
    async function saveSetting(
      body: SettingsBody,
      message: string,
      undoBody?: SettingsBody,
      afterSave?: () => void,
      afterUndo?: () => void
    ) {
      try {
        await updateSettings(body);
        await queryClient.invalidateQueries({ queryKey: ["settings"] });
        afterSave?.();
        toast.success(
          message,
          undoBody
            ? {
                action: {
                  label: "Desfazer",
                  onClick: () => {
                    updateSettings(undoBody)
                      .then(() =>
                        queryClient.invalidateQueries({
                          queryKey: ["settings"],
                        })
                      )
                      .then(() => afterUndo?.())
                      .catch(() =>
                        toast.error("Não foi possível desfazer a alteração.")
                      );
                  },
                },
              }
            : undefined
        );
        return true;
      } catch {
        toast.error("Não foi possível salvar. Tente de novo.");
        return false;
      }
    },
    [queryClient]
  );

  const openEditor = useCallback(
    (next: Exclude<Editor, null>) => {
      if (!settings) {
        return;
      }
      if (next === "reviewTime") {
        setTime(settings.reviewTime);
      }
      if (next === "timezone") {
        setTimezone(settings.timezone);
        setTimezoneAuto(settings.timezoneAuto);
      }
      if (next === "newCardsPerDay") {
        setNewCardsPerDay(settings.newCardsPerDay);
      }
      if (next === "theme") {
        setThemeDraft(settings.theme);
      }
      if (next === "name") {
        setNameDraft(session?.user.name ?? "");
      }
      if (next === "delete") {
        setConfirmation("");
      }
      setEditor(next);
    },
    [settings, session]
  );

  const saveTimezone = useCallback(async () => {
    const nextTimezone = timezoneAuto
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : timezone;
    const ok = await save(
      { timezone: nextTimezone, timezoneAuto },
      `Fuso horário: ${timezoneLabel(nextTimezone, timezoneAuto)}.`,
      { timezone: settings?.timezone, timezoneAuto: settings?.timezoneAuto }
    );
    if (ok) {
      setEditor(null);
    }
  }, [save, settings, timezone, timezoneAuto]);

  const saveTime = useCallback(async () => {
    const ok = await save(
      { reviewTime: time },
      `Aviso da revisão às ${time}.`,
      { reviewTime: settings?.reviewTime }
    );
    if (ok) {
      setEditor(null);
    }
  }, [save, settings, time]);

  const saveNewCards = useCallback(async () => {
    const ok = await save(
      { newCardsPerDay },
      `Limite atualizado para ${newCardsPerDay} Cards novos por dia.`,
      { newCardsPerDay: settings?.newCardsPerDay }
    );
    if (ok) {
      setEditor(null);
    }
  }, [newCardsPerDay, save, settings]);

  const saveTheme = useCallback(async () => {
    const previousTheme = settings?.theme;
    const ok = await save(
      { theme: themeDraft },
      `Tema ${themeNameFrom(themeDraft)} aplicado.`,
      { theme: previousTheme },
      () => setTheme(themeDraft),
      () => previousTheme && setTheme(previousTheme)
    );
    if (ok) {
      setEditor(null);
    }
  }, [save, setTheme, settings, themeDraft]);

  const handleEditorChange = useCallback((open: boolean) => {
    if (!open) {
      setEditor(null);
    }
  }, []);
  const openReviewTime = useCallback(
    () => openEditor("reviewTime"),
    [openEditor]
  );
  const openTimezone = useCallback(() => openEditor("timezone"), [openEditor]);
  const openNewCards = useCallback(
    () => openEditor("newCardsPerDay"),
    [openEditor]
  );
  const openTheme = useCallback(() => openEditor("theme"), [openEditor]);
  const openName = useCallback(() => openEditor("name"), [openEditor]);
  const openDelete = useCallback(() => openEditor("delete"), [openEditor]);
  const resumeNewCards = useCallback(
    () =>
      save({ newCardsPaused: false }, "Cards novos retomados.", {
        newCardsPaused: true,
      }),
    [save]
  );
  const toggleEmailReminder = useCallback(
    (checked: boolean) =>
      save(
        { emailReminder: checked },
        checked ? "Aviso por e-mail ligado." : "Aviso por e-mail desligado.",
        { emailReminder: !checked }
      ),
    [save]
  );
  const toggleAppReminder = useCallback(
    (checked: boolean) =>
      save(
        { inAppReminder: checked },
        checked ? "Aviso no app ligado." : "Aviso no app desligado.",
        { inAppReminder: !checked }
      ),
    [save]
  );
  const setThemeOption = useCallback((value: string) => {
    if (THEMES.some(([theme]) => theme === value)) {
      setThemeDraft(value as Settings["theme"]);
    }
  }, []);

  const saveName = useCallback(async () => {
    const nextName = nameDraft.trim();
    if (!(nextName && session?.user.name)) {
      return;
    }
    const previousName = session.user.name;
    setBusy(true);
    try {
      const { error } = await authClient.updateUser({ name: nextName });
      if (error) {
        toast.error("Não foi possível salvar seu nome.", {
          description: error.message,
        });
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ["session"] });
      setEditor(null);
      toast.success("Seu nome foi atualizado.", {
        action: {
          label: "Desfazer",
          onClick: async () => {
            const result = await authClient.updateUser({ name: previousName });
            if (result.error) {
              toast.error("Não foi possível desfazer a alteração.");
              return;
            }
            await queryClient.invalidateQueries({ queryKey: ["session"] });
          },
        },
      });
    } catch {
      toast.error("Não foi possível salvar seu nome. Tente de novo.");
    } finally {
      setBusy(false);
    }
  }, [nameDraft, queryClient, session]);

  const signOut = useCallback(async () => {
    const { error } = await authClient.signOut();
    if (error) {
      toast.error("Não foi possível sair. Tente de novo.");
      return;
    }
    queryClient.clear();
    await router.navigate({ to: "/entrar" });
  }, [queryClient, router]);

  const removeAccount = useCallback(async () => {
    if (!session?.user.email) {
      return;
    }
    setBusy(true);
    try {
      await deleteAccount(session.user.email);
      queryClient.clear();
      await router.navigate({ to: "/entrar" });
    } catch {
      setBusy(false);
      toast.error("Não foi possível apagar a conta. Tente de novo.");
    }
  }, [queryClient, router, session]);

  if (settingsQueryResult.isError) {
    return (
      <div className="mx-auto max-w-2xl space-y-3" role="alert">
        <h1 className="font-heading font-semibold text-2xl">
          Configurações indisponíveis
        </h1>
        <p className="text-muted-foreground text-sm">
          Não foi possível carregar suas preferências.
        </p>
        <Button
          disabled={settingsQueryResult.isFetching}
          onClick={retrySettings}
          variant="outline"
        >
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (!settings) {
    return (
      <div
        aria-label="Carregando configurações"
        className="mx-auto max-w-2xl space-y-4"
        role="status"
      >
        <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
        {[1, 2, 3, 4].map((item) => (
          <div className="h-32 animate-pulse rounded-xl bg-muted" key={item} />
        ))}
      </div>
    );
  }

  const user = session?.user;
  const accountEmail = user?.email ?? "";

  return (
    <div className="mx-auto max-w-2xl space-y-7 pb-8">
      <h1 className="hidden font-heading font-semibold text-3xl tracking-tight md:block">
        Configurações
      </h1>
      <SettingsOverview
        accountEmail={accountEmail}
        onAppReminderChange={toggleAppReminder}
        onDeleteClick={openDelete}
        onEmailReminderChange={toggleEmailReminder}
        onNameClick={openName}
        onNewCardsClick={openNewCards}
        onOpenTheme={openTheme}
        onResumeNewCards={resumeNewCards}
        onReviewTimeClick={openReviewTime}
        onSignOut={signOut}
        onTimezoneClick={openTimezone}
        settings={settings}
        user={user}
      />
      <SettingsEditor
        accountEmail={accountEmail}
        busy={busy}
        confirmation={confirmation}
        editor={editor}
        nameDraft={nameDraft}
        newCardsPerDay={newCardsPerDay}
        onDelete={removeAccount}
        onNameChange={setNameDraft}
        onNewCardsSave={saveNewCards}
        onOpenChange={handleEditorChange}
        onSaveName={saveName}
        onSetConfirmation={setConfirmation}
        onSetNewCardsPerDay={setNewCardsPerDay}
        onSetTime={setTime}
        onSetTimezone={setTimezone}
        onSetTimezoneAuto={setTimezoneAuto}
        onThemeClick={setThemeOption}
        onThemeSave={saveTheme}
        onTimeSave={saveTime}
        onTimezoneSave={saveTimezone}
        themeDraft={themeDraft}
        time={time}
        timezone={timezone}
        timezoneAuto={timezoneAuto}
      />
    </div>
  );
}

function SettingsEditor({
  accountEmail,
  busy,
  confirmation,
  editor,
  newCardsPerDay,
  nameDraft,
  onDelete,
  onNameChange,
  onSaveName,
  onSetConfirmation,
  onSetNewCardsPerDay,
  onSetTime,
  onSetTimezone,
  onSetTimezoneAuto,
  onThemeSave,
  onTimeSave,
  onTimezoneSave,
  onNewCardsSave,
  onOpenChange,
  onThemeClick,
  themeDraft,
  time,
  timezone,
  timezoneAuto,
}: {
  accountEmail: string;
  busy: boolean;
  confirmation: string;
  editor: Editor;
  newCardsPerDay: number;
  nameDraft: string;
  onDelete: () => void;
  onNameChange: (value: string) => void;
  onSaveName: () => void;
  onSetConfirmation: (value: string) => void;
  onSetNewCardsPerDay: (value: number) => void;
  onSetTime: (value: string) => void;
  onSetTimezone: (value: string) => void;
  onSetTimezoneAuto: (value: boolean) => void;
  onThemeSave: () => void;
  onTimeSave: () => void;
  onTimezoneSave: () => void;
  onNewCardsSave: () => void;
  onOpenChange: (open: boolean) => void;
  onThemeClick: (value: string) => void;
  themeDraft: Settings["theme"];
  time: string;
  timezone: string;
  timezoneAuto: boolean;
}) {
  const canDelete =
    confirmation.trim().toLowerCase() === accountEmail.toLowerCase();

  const closeEditor = useCallback(() => onOpenChange(false), [onOpenChange]);
  const handleTimeChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) =>
      onSetTime(event.currentTarget.value),
    [onSetTime]
  );
  const chooseTime = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      const { value } = event.currentTarget.dataset;
      if (value) {
        onSetTime(value);
      }
    },
    [onSetTime]
  );
  const chooseTimezone = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      const { value } = event.currentTarget.dataset;
      if (value) {
        onSetTimezone(value);
      }
    },
    [onSetTimezone]
  );
  const adjustNewCards = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      const delta = event.currentTarget.dataset.direction === "up" ? 5 : -5;
      onSetNewCardsPerDay(Math.min(200, Math.max(0, newCardsPerDay + delta)));
    },
    [newCardsPerDay, onSetNewCardsPerDay]
  );
  const chooseNewCards = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      const { value: rawValue } = event.currentTarget.dataset;
      const value = Number(rawValue);
      if (Number.isInteger(value)) {
        onSetNewCardsPerDay(value);
      }
    },
    [onSetNewCardsPerDay]
  );
  const handleNameChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) =>
      onNameChange(event.currentTarget.value),
    [onNameChange]
  );
  const handleConfirmationChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) =>
      onSetConfirmation(event.currentTarget.value),
    [onSetConfirmation]
  );
  return (
    <>
      <ResponsiveDialog
        description="Hora em que chega o aviso da revisão de hoje."
        onOpenChange={onOpenChange}
        open={editor === "reviewTime"}
        title="Review Time"
      >
        <label className="sr-only" htmlFor="review-time">
          Horário do aviso
        </label>
        <Input
          className="mt-2 h-14 text-center font-heading text-2xl tabular-nums"
          id="review-time"
          onChange={handleTimeChange}
          type="time"
          value={time}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {["07:00", "12:00", "19:00", "21:00"].map((value) => (
            <Button
              aria-pressed={time === value}
              data-value={value}
              key={value}
              onClick={chooseTime}
              size="sm"
              variant={time === value ? "secondary" : "outline"}
            >
              {value}
            </Button>
          ))}
        </div>
        <p className="mt-4 text-muted-foreground text-xs">
          Fuso: {timezoneLabel(timezone, timezoneAuto)}.
        </p>
        <DialogActions>
          <Button onClick={closeEditor} variant="outline">
            Cancelar
          </Button>
          <Button onClick={onTimeSave}>Salvar</Button>
        </DialogActions>
      </ResponsiveDialog>

      <ResponsiveDialog
        description="Escolha como o Daruma calcula o início de cada dia."
        onOpenChange={onOpenChange}
        open={editor === "timezone"}
        title="Fuso horário"
      >
        <div className="mt-2 flex items-center justify-between gap-3 rounded-lg bg-muted px-3 py-3 text-sm">
          <span>
            <span className="block font-medium">Automático</span>
            <span className="text-muted-foreground text-xs">
              Usar o fuso do aparelho
            </span>
          </span>
          <Switch
            aria-label="Usar fuso automático"
            checked={timezoneAuto}
            onCheckedChange={onSetTimezoneAuto}
          />
        </div>
        <fieldset
          aria-label="Fusos disponíveis"
          className={`m-0 mt-3 max-h-56 min-w-0 space-y-1 overflow-y-auto border-0 p-0 ${timezoneAuto ? "pointer-events-none opacity-50" : ""}`}
        >
          {ZONES.map(([value, label]) => (
            <button
              aria-pressed={timezone === value}
              className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              data-value={value}
              key={value}
              onClick={chooseTimezone}
              type="button"
            >
              <span className="flex-1">{label}</span>
              <span className="text-muted-foreground text-xs">
                {value.replaceAll("_", " ")}
              </span>
              {timezone === value ? (
                <Check aria-hidden="true" className="size-4 text-primary" />
              ) : null}
            </button>
          ))}
        </fieldset>
        <DialogActions>
          <Button onClick={closeEditor} variant="outline">
            Cancelar
          </Button>
          <Button onClick={onTimezoneSave}>Salvar</Button>
        </DialogActions>
      </ResponsiveDialog>

      <ResponsiveDialog
        description="Quantos Cards novos entram na revisão de cada dia. Não vale para Estudar agora."
        onOpenChange={onOpenChange}
        open={editor === "newCardsPerDay"}
        title="Novos por dia"
      >
        <div className="mt-4 flex items-center justify-center gap-6">
          <Button
            aria-label="Diminuir limite"
            data-direction="down"
            disabled={newCardsPerDay === 0}
            onClick={adjustNewCards}
            size="icon"
            variant="outline"
          >
            <Minus />
          </Button>
          <output
            aria-live="polite"
            className="min-w-16 text-center font-heading font-semibold text-4xl tabular-nums"
          >
            {newCardsPerDay}
          </output>
          <Button
            aria-label="Aumentar limite"
            data-direction="up"
            disabled={newCardsPerDay === 200}
            onClick={adjustNewCards}
            size="icon"
            variant="outline"
          >
            <Plus />
          </Button>
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {[10, 20, 30, 50].map((value) => (
            <Button
              aria-pressed={newCardsPerDay === value}
              data-value={value}
              key={value}
              onClick={chooseNewCards}
              size="sm"
              variant={newCardsPerDay === value ? "secondary" : "outline"}
            >
              {value}
              {value === 20 ? " · padrão" : ""}
            </Button>
          ))}
        </div>
        <p className="mt-4 text-center text-muted-foreground text-xs">
          De 0 a 200 Cards, em passos de 5.
        </p>
        <DialogActions>
          <Button onClick={closeEditor} variant="outline">
            Cancelar
          </Button>
          <Button onClick={onNewCardsSave}>Salvar</Button>
        </DialogActions>
      </ResponsiveDialog>

      <ResponsiveDialog
        description="Escolha o tema das telas do Daruma."
        onOpenChange={onOpenChange}
        open={editor === "theme"}
        title="Tema"
      >
        <RadioGroup
          className="mt-2"
          onValueChange={onThemeClick}
          value={themeDraft}
        >
          {THEMES.map(([value, label, description]) => (
            <div
              className="flex min-h-14 cursor-pointer items-center gap-3 rounded-lg px-3 hover:bg-accent"
              key={value}
            >
              <RadioGroupItem aria-label={label} value={value} />
              <span className="flex-1">
                <span className="block font-medium text-sm">{label}</span>
                <span className="text-muted-foreground text-xs">
                  {description}
                </span>
              </span>
            </div>
          ))}
        </RadioGroup>
        <DialogActions>
          <Button onClick={closeEditor} variant="outline">
            Cancelar
          </Button>
          <Button onClick={onThemeSave}>Aplicar tema</Button>
        </DialogActions>
      </ResponsiveDialog>

      <ResponsiveDialog
        description="Esse nome aparece na saudação do Início."
        onOpenChange={onOpenChange}
        open={editor === "name"}
        title="Seu nome"
      >
        <label
          className="mt-2 block font-medium text-sm"
          htmlFor="account-name"
        >
          Nome
        </label>
        <Input
          autoComplete="name"
          className="mt-1.5"
          id="account-name"
          maxLength={80}
          onChange={handleNameChange}
          value={nameDraft}
        />
        <p className="mt-4 font-medium text-sm">E-mail</p>
        <p className="text-muted-foreground text-sm">
          {accountEmail} · não dá para trocar por aqui.
        </p>
        <DialogActions>
          <Button onClick={closeEditor} variant="outline">
            Cancelar
          </Button>
          <Button disabled={!nameDraft.trim() || busy} onClick={onSaveName}>
            Salvar
          </Button>
        </DialogActions>
      </ResponsiveDialog>

      <ResponsiveDialog
        description="Seus dados serão apagados sem possibilidade de recuperação."
        onOpenChange={onOpenChange}
        open={editor === "delete"}
        title="Apagar sua conta?"
      >
        <p className="mt-2 text-muted-foreground text-sm">
          Seus Decks, Cards, Labels, Comments e o histórico de Ratings somem
          para sempre. Não dá para desfazer.
        </p>
        <label
          className="mt-4 block font-medium text-sm"
          htmlFor="delete-account-email"
        >
          Digite seu e-mail para confirmar
        </label>
        <Input
          autoComplete="email"
          className="mt-1.5"
          id="delete-account-email"
          onChange={handleConfirmationChange}
          placeholder={accountEmail}
          value={confirmation}
        />
        <DialogActions>
          <Button disabled={busy} onClick={closeEditor} variant="outline">
            Cancelar
          </Button>
          <Button
            disabled={!canDelete || busy}
            onClick={onDelete}
            variant="destructive"
          >
            Apagar conta
          </Button>
        </DialogActions>
      </ResponsiveDialog>
    </>
  );
}
