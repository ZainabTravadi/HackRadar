export type DateInput = Date | string | null | undefined;

const DISPLAY_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export function parseHackathonDate(value: DateInput): Date | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const isoLikeMatch = trimmed.match(/^\d{4}-\d{2}-\d{2}(?:[T\s]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/);
  if (isoLikeMatch) {
    const [year, month, day] = trimmed.slice(0, 10).split("-").map(Number);
    const normalized = new Date(Date.UTC(year, month - 1, day));
    if (
      normalized.getUTCFullYear() !== year ||
      normalized.getUTCMonth() !== month - 1 ||
      normalized.getUTCDate() !== day
    ) {
      return null;
    }
  }

  return parsed;
}

export function formatHackathonDate(value: DateInput): string {
  const parsed = parseHackathonDate(value);
  if (!parsed) {
    return "Date unavailable";
  }

  return DISPLAY_DATE_FORMATTER.format(parsed);
}
