import * as cheerio from 'cheerio';

import type { RawHackathon } from '../../../pipeline/normalizer';

export function parseHack2SkillPayload(payload: string | Record<string, unknown>): RawHackathon[] {
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    const record = payload as Record<string, unknown>;
    if (Array.isArray(record.data)) {
      return record.data.flatMap((entry) => mapEventToRawHackathon(entry));
    }
  }

  if (typeof payload !== 'string') {
    return [];
  }

  const $ = cheerio.load(payload);
  const items: RawHackathon[] = [];
  const seen = new Set<string>();

  $('a[href]').each((_, element) => {
    const href = $(element).attr('href');
    const title = $(element).text().trim() || $(element).attr('aria-label') || '';
    const normalizedUrl = normalizeUrl(href);

    if (!normalizedUrl || !looksLikeHackathon(title, normalizedUrl)) {
      return;
    }

    if (seen.has(normalizedUrl)) {
      return;
    }

    seen.add(normalizedUrl);
    items.push({
      title: title.length > 80 ? title.slice(0, 77) + '...' : title || 'Hack2skill event',
      description: `Hack2skill event from ${normalizedUrl}`,
      sourceUrl: normalizedUrl,
      sourceId: normalizedUrl,
      source: 'hack2skill',
      rawData: { html: payload.slice(0, 1400), href: normalizedUrl },
    });
  });

  return items.slice(0, 25);
}

function mapEventToRawHackathon(entry: unknown): RawHackathon[] {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    return [];
  }

  const item = entry as Record<string, unknown>;
  const id = String(item._id ?? '').trim();
  const eventUrl = String(item.eventUrl ?? '').trim();
  const title = String(item.title ?? '').trim();

  if (!id || !eventUrl || !title) {
    return [];
  }

  const mode = String(item.mode ?? '').trim();
  const participation = String(item.participation ?? '').trim();
  const registrationStart = parseDate(item.registrationStart);
  const registrationEnd = parseDate(item.registrationEnd);
  const submissionStart = parseDate(item.submissionStart);
  const submissionEnd = parseDate(item.submissionEnd);

  return [{
    title,
    description: `${title} ${mode} ${participation}`.trim(),
    sourceUrl: `https://hack2skill.com/event/${eventUrl}`,
    sourceId: id,
    source: 'hack2skill',
    imageUrl: String(item.thumbnail ?? '').trim() || undefined,
    registrationDeadline: registrationEnd,
    submissionDeadline: submissionEnd,
    startDate: registrationStart ?? submissionStart,
    endDate: submissionEnd ?? registrationEnd,
    locationText: [mode, participation].filter(Boolean).join(' ') || undefined,
    rawData: { event: item },
  }];
}

function normalizeUrl(href: string | undefined): string | null {
  if (!href) {
    return null;
  }

  const trimmed = href.trim();
  if (!trimmed || trimmed.startsWith('javascript:') || trimmed.startsWith('mailto:')) {
    return null;
  }

  try {
    return new URL(trimmed, 'https://hack2skill.com').toString();
  } catch {
    return trimmed;
  }
}

function parseDate(value: unknown): Date | undefined {
  if (typeof value !== 'string' || !value) {
    return undefined;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function looksLikeHackathon(title: string, url: string): boolean {
  const lowerTitle = title.toLowerCase();
  const lowerUrl = url.toLowerCase();
  return lowerUrl.includes('hack2skill.com') && (lowerTitle.includes('hack') || lowerUrl.includes('/hackathon') || lowerUrl.includes('/hackathons'));
}
