import type { Settings } from "@daruma/shared";
import { Link } from "@tanstack/react-router";
import {
  Bell,
  ChevronRight,
  Clock3,
  Globe2,
  LogOut,
  Mail,
  Palette,
  Sparkles,
} from "lucide-react";
import type { ReactNode } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Switch } from "~/components/ui/switch";
import { timezoneLabel } from "~/lib/settings";

interface AccountUser {
  email: string;
  image?: string | null;
  name: string;
}

interface Props {
  accountEmail: string;
  onAppReminderChange: (checked: boolean) => void;
  onDeleteClick: () => void;
  onEmailReminderChange: (checked: boolean) => void;
  onNameClick: () => void;
  onNewCardsClick: () => void;
  onOpenTheme: () => void;
  onResumeNewCards: () => void;
  onReviewTimeClick: () => void;
  onSignOut: () => void;
  onTimezoneClick: () => void;
  settings: Settings;
  user?: AccountUser;
}

const WORDS = /\s+/;

const THEMES = [
  ["light", "Claro"],
  ["dark", "Escuro"],
  ["system", "Sistema"],
] as const;

export function SettingsOverview({
  accountEmail,
  onDeleteClick,
  onEmailReminderChange,
  onNameClick,
  onNewCardsClick,
  onOpenTheme,
  onReviewTimeClick,
  onResumeNewCards,
  onSignOut,
  onTimezoneClick,
  onAppReminderChange,
  settings,
  user,
}: Props) {
  const themeName =
    THEMES.find(([value]) => value === settings.theme)?.[1] ?? "Sistema";
  const timezonesTitle = timezoneLabel(
    settings.timezone,
    settings.timezoneAuto
  );

  return (
    <>
      <SettingsGroup title="Estudo">
        <SettingsRow
          detail="Hora do aviso da revisão de hoje"
          icon={<Clock3 />}
          onClick={onReviewTimeClick}
          title="Review Time"
          value={settings.reviewTime}
        />
        <SettingsRow
          icon={<Globe2 />}
          onClick={onTimezoneClick}
          title="Fuso horário"
          value={timezonesTitle}
        />
        <SettingsRow
          detail="Cards novos na revisão de cada dia"
          icon={<Sparkles />}
          onClick={onNewCardsClick}
          title="Novos por dia"
          value={
            settings.newCardsPaused ? (
              <span className="text-warning">Pausados</span>
            ) : (
              String(settings.newCardsPerDay)
            )
          }
        />
        {settings.newCardsPaused ? (
          <div className="flex flex-col gap-3 bg-warning/10 px-4 py-3.5 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-warning-foreground">
              Cards novos pausados até você pôr a revisão em dia.
            </p>
            <Button
              className="self-start sm:self-auto"
              onClick={onResumeNewCards}
              size="sm"
              variant="outline"
            >
              Retomar
            </Button>
          </div>
        ) : null}
      </SettingsGroup>

      <SettingsGroup title="Notificações">
        <SwitchRow
          checked={settings.emailReminder}
          detail={`Às ${settings.reviewTime}, para ${accountEmail}`}
          icon={<Mail />}
          onCheckedChange={onEmailReminderChange}
          title="Aviso por e-mail"
        />
        <SwitchRow
          checked={settings.inAppReminder}
          detail={`Ponto no sino às ${settings.reviewTime}. A faixa do Início aparece sempre.`}
          icon={<Bell />}
          onCheckedChange={onAppReminderChange}
          title="Aviso no app"
        />
      </SettingsGroup>

      <SettingsGroup title="Aparência">
        <SettingsRow
          icon={<Palette />}
          onClick={onOpenTheme}
          title="Tema"
          value={themeName}
        />
      </SettingsGroup>

      <SettingsGroup title="Conta">
        <button
          className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={onNameClick}
          type="button"
        >
          <Avatar className="size-10" size="lg">
            {user?.image ? <AvatarImage alt="" src={user.image} /> : null}
            <AvatarFallback>{initials(user?.name ?? "?")}</AvatarFallback>
          </Avatar>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium">{user?.name}</span>
            <span className="block truncate text-muted-foreground text-sm">
              {accountEmail}
            </span>
          </span>
          <ChevronRight
            aria-hidden="true"
            className="size-4 text-muted-foreground"
          />
        </button>
        <div className="flex items-center gap-3 px-4 py-3.5">
          <GoogleMark />
          <span className="min-w-0 flex-1">
            <span className="block font-medium text-sm">Google</span>
            <span className="block truncate text-muted-foreground text-xs">
              Você entra com {accountEmail}
            </span>
          </span>
        </div>
        <button
          className="flex w-full items-center gap-3 px-4 py-3.5 text-left font-medium text-destructive text-sm transition-colors hover:bg-destructive/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={onSignOut}
          type="button"
        >
          <LogOut aria-hidden="true" className="size-[18px]" />
          Sair
        </button>
      </SettingsGroup>

      <p className="flex flex-wrap items-center justify-center gap-3 text-muted-foreground text-sm">
        <Link
          className="underline-offset-4 hover:text-foreground hover:underline"
          to="/privacidade"
        >
          Termos e privacidade
        </Link>
        <span aria-hidden="true">·</span>
        <button
          className="underline-offset-4 hover:text-destructive hover:underline"
          onClick={onDeleteClick}
          type="button"
        >
          Apagar conta
        </button>
      </p>
    </>
  );
}

function initials(name: string) {
  return name
    .trim()
    .split(WORDS)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase("pt-BR"))
    .join("");
}

function SettingsGroup({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <section aria-label={title} className="space-y-2">
      <h2 className="px-1 font-medium text-sm">{title}</h2>
      <div className="divide-y overflow-hidden rounded-xl border bg-card shadow-card">
        {children}
      </div>
    </section>
  );
}

function SettingsRow({
  icon,
  title,
  detail,
  value,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  detail?: string;
  value: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className="flex min-h-16 w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      onClick={onClick}
      type="button"
    >
      <span className="text-muted-foreground [&_svg]:size-[18px]">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium text-sm">{title}</span>
        {detail ? (
          <span className="block text-muted-foreground text-xs">{detail}</span>
        ) : null}
      </span>
      <span className="max-w-[42%] truncate text-right text-muted-foreground text-sm">
        {value}
      </span>
      <ChevronRight
        aria-hidden="true"
        className="size-4 shrink-0 text-muted-foreground"
      />
    </button>
  );
}

function SwitchRow({
  icon,
  title,
  detail,
  checked,
  onCheckedChange,
}: {
  icon: ReactNode;
  title: string;
  detail: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex min-h-16 items-center gap-3 px-4 py-3.5">
      <span className="text-muted-foreground [&_svg]:size-[18px]">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium text-sm">{title}</span>
        <span className="block text-muted-foreground text-xs">{detail}</span>
      </span>
      <Switch
        aria-label={title}
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
}

function GoogleMark() {
  return (
    <svg
      aria-hidden="true"
      className="size-[18px] shrink-0"
      viewBox="0 0 24 24"
    >
      <path
        d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.87h5.38a4.6 4.6 0 0 1-2 3.02v2.52h3.24c1.9-1.75 2.98-4.32 2.98-7.36Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.52c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.59-4.13H3.06v2.6A10 10 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.41 13.9a6.02 6.02 0 0 1 0-3.8V7.5H3.06a10 10 0 0 0 0 9Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.97c1.47 0 2.8.5 3.84 1.5l2.88-2.88A9.63 9.63 0 0 0 12 1a10 10 0 0 0-8.94 5.5l3.35 2.6C7.2 7.73 9.4 5.97 12 5.97Z"
        fill="#EA4335"
      />
    </svg>
  );
}
