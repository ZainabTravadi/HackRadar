import type { RawHackathon } from '../../../pipeline/normalizer';

interface DevpostApiHackathon {
  id?: number | string;
  title?: string;
  url?: string;
  tagline?: string;
  submission_period_dates?: string;
  prize_amount?: string | number | null;
  registrations_count?: number | string | null;
  location?: string | null;
  themes?: Array<{ name?: string } | string | null> | null;
  organization_name?: string | null;
}

export function parseDevpostPayload(payload: unknown): RawHackathon[] {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return [];
  }

  const record = payload as Record<string, unknown>;
  const items = Array.isArray(record.hackathons) ? record.hackathons : [];

  return items.flatMap((entry) => {
    const item = entry as DevpostApiHackathon;
    const title = item.title?.trim();
    const sourceUrl = item.url?.trim();
    const sourceId = String(item.id ?? '').trim();

    if (!title || !sourceUrl || !sourceId) {
      return [];
    }

    const submissionPeriod = item.submission_period_dates?.trim() ?? '';
    const startDate = parseDateFromRange(submissionPeriod, true);
    const submissionDeadline = parseDateFromRange(submissionPeriod, false);

    const descriptionText = normalizeDescription(item.tagline?.trim() || '', title);

    return [{
      title,
      description: descriptionText,
      sourceUrl,
      sourceId,
      source: 'devpost',
      organizerName: item.organization_name?.trim() || undefined,
      submissionDeadline,
      startDate,
      prizeText: item.prize_amount != null ? String(item.prize_amount).trim() : undefined,
      locationText: item.location?.trim() || undefined,
      participantCount: toNumberOrNull(item.registrations_count),
      rawData: {
        payload: item,
        parsedAt: new Date().toISOString(),
      },
    }];
  });
}

function parseDateFromRange(value: string, first: boolean): Date | undefined {
  if (!value) {
    return undefined;
  }

  const parts = value.split(/\s+(?:-|–|—|to)\s+/i).map((part) => part.trim()).filter(Boolean);
  if (parts.length === 0) {
    return undefined;
  }

  const candidate = first ? parts[0] : parts[parts.length - 1];
  const parsed = new Date(candidate);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function normalizeDescription(value: string, fallbackTitle: string): string {
  const cleaned = value.replace(/\s+/g, ' ').trim();
  if (!cleaned) {
    return fallbackTitle;
  }

  return cleaned.length > 220 ? `${cleaned.slice(0, 217)}...` : cleaned;
}

function toNumberOrNull(value: number | string | null | undefined): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.trunc(value);
  }

  if (typeof value === 'string') {
    const parsed = Number(value.replace(/,/g, '').trim());
    return Number.isNaN(parsed) ? undefined : Math.trunc(parsed);
  }

  return undefined;
}
