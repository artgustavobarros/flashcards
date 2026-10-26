// A Day is a date on the user's own calendar, 'YYYY-MM-DD'. "Today" depends on the user's
// timezone; once a Day is stored it never moves, even if the user changes timezone later.
export type Day = string;

const MS_PER_DAY = 86_400_000;

export function localDay(now: Date, timeZone: string): Day {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

// ts-fsrs counts in whole days only if every date it sees is a UTC midnight, so a Day is
// handed to it as one.
export const dayStart = (day: Day) => new Date(`${day}T00:00:00Z`);

export const toDay = (date: Date): Day => date.toISOString().slice(0, 10);

export const addDays = (day: Day, days: number): Day =>
  toDay(new Date(dayStart(day).getTime() + days * MS_PER_DAY));

// The time of day on the user's clock, as 'HH:MM'.
export function localTime(now: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    timeZone,
  }).format(now);
}
