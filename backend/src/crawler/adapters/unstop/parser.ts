import type { RawHackathon } from '../../../pipeline/normalizer';

export function parseUnstopPayload(payload: unknown): RawHackathon[] {
  if (!payload || typeof payload !== 'object') {
    if (typeof payload === 'string') {
      try {
        const parsed = JSON.parse(payload);
        return parseUnstopPayload(parsed);
      } catch {
        return [];
      }
    }

    return [];
  }

  const root = payload as Record<string, unknown>;
  const dataEntries = Array.isArray(root.data) ? root.data : Array.isArray((root as Record<string, any>).data?.data) ? (root as Record<string, any>).data.data : [];

  return dataEntries.slice(0, 25).map((entry: any, index: number) => ({
    title: (entry?.title as string) || `Unstop hackathon ${index + 1}`,
    description: stripHtml(entry?.details ?? entry?.description ?? ''),
    sourceUrl: entry?.seo_url ? String(entry.seo_url) : `https://unstop.com/${entry?.public_url ?? ''}`,
    sourceId: String(entry?.id ?? entry?.public_url ?? index),
    source: 'unstop',
    organizerName: entry?.organisation?.name ? String(entry.organisation.name) : undefined,
    registrationDeadline: parseDate(entry?.registration_deadline ?? entry?.updated_at),
    prizeText: extractPrizeText(entry?.prizes),
    locationText: entry?.region ? String(entry.region) : undefined,
    rawData: { entry, payload },
  }));
}

function stripHtml(value: string): string {
  if (!value) {
    return '';
  }

  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function parseDate(value: unknown): Date | undefined {
  if (typeof value !== 'string' || !value) {
    return undefined;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function extractPrizeText(prizes: unknown): string | undefined {
  if (!Array.isArray(prizes) || prizes.length === 0) {
    return undefined;
  }

  return prizes
    .map((prize) => {
      const item = prize as Record<string, unknown>;
      return [item?.rank ? String(item.rank) : '', item?.cash ? `${item.cash}` : '', item?.currencyCode ? String(item.currencyCode) : ''].filter(Boolean).join(' ');
    })
    .filter(Boolean)
    .join(' | ');
}
