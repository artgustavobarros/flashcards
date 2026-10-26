const TIME_ZONE_NAMES: Record<string, string> = {
  "America/Manaus": "Amazonas",
  "America/New_York": "Nova York",
  "America/Noronha": "Fernando de Noronha",
  "America/Rio_Branco": "Acre",
  "America/Sao_Paulo": "Horário de Brasília",
  "Europe/Lisbon": "Lisboa",
};

export function timezoneLabel(timezone: string, automatic: boolean) {
  const name = TIME_ZONE_NAMES[timezone] ?? timezone;
  return automatic ? `${name} (automático)` : name;
}
