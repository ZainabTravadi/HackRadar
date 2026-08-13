export type HackathonStatus = 'upcoming' | 'open' | 'closing_soon' | 'ended';

export interface StatusDates {
  registrationDeadline?: Date | string | null;
  submissionDeadline?: Date | string | null;
  eventEndDate?: Date | string | null;
  endDate?: Date | string | null;
}

export function resolveHackathonDeadline(dates: StatusDates): Date | null {
  return toDate(dates.registrationDeadline)
    ?? toDate(dates.submissionDeadline)
    ?? toDate(dates.eventEndDate)
    ?? toDate(dates.endDate)
    ?? null;
}

export function computeHackathonStatus(dates: StatusDates): HackathonStatus {
  const now = new Date();
  const deadline = resolveHackathonDeadline(dates);

  if (!deadline) {
    return 'upcoming';
  }

  if (deadline.getTime() < now.getTime()) {
    return 'ended';
  }

  const closingSoonCutoff = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  if (deadline.getTime() <= closingSoonCutoff.getTime()) {
    return 'closing_soon';
  }

  return 'open';
}

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
