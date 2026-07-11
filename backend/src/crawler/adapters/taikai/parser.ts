import * as cheerio from 'cheerio';

import type { RawHackathon } from '../../../pipeline/normalizer';

export function parseTaikaiPayload(payload: string | Record<string, unknown>): RawHackathon[] {
  if (typeof payload !== 'string') {
    const challenges = getChallengesFromPayload(payload);
    if (challenges.length > 0) {
      return challenges.flatMap((challenge) => mapChallengeToRawHackathon(challenge));
    }

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
      title: title.length > 80 ? title.slice(0, 77) + '...' : title || 'TAIKAI event',
      description: `TAIKAI event from ${normalizedUrl}`,
      sourceUrl: normalizedUrl,
      sourceId: normalizedUrl,
      source: 'taikai',
      rawData: { html: payload.slice(0, 1400), href: normalizedUrl },
    });
  });

  return items.slice(0, 25);
}

function getChallengesFromPayload(payload: Record<string, unknown>): Record<string, unknown>[] {
  const data = payload.data;
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const dataRecord = data as Record<string, unknown>;
    if (Array.isArray(dataRecord.challenges)) {
      return dataRecord.challenges.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object' && !Array.isArray(item)));
    }
  }

  if (Array.isArray(payload.challenges)) {
    return payload.challenges.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object' && !Array.isArray(item)));
  }

  return [];
}

function mapChallengeToRawHackathon(challenge: Record<string, unknown>): RawHackathon[] {
  const id = String(challenge.id ?? '').trim();
  const slug = String(challenge.slug ?? '').trim();
  const name = String(challenge.name ?? '').trim();
  const organization = challenge.organization && typeof challenge.organization === 'object' && !Array.isArray(challenge.organization)
    ? challenge.organization as Record<string, unknown>
    : null;
  const orgSlug = String(organization?.slug ?? '').trim();
  const orgName = String(organization?.name ?? '').trim();
  const shortDescription = String(challenge.shortDescription ?? '').trim();
  const prize = formatPrize(challenge.prize, challenge.prizeCurrency);
  const imageUrl = extractImageUrl(challenge);
  const sourceUrl = buildSourceUrl(orgSlug, slug);
  const steps = Array.isArray(challenge.steps) ? challenge.steps : [];
  const currentStep = challenge.currentStep && typeof challenge.currentStep === 'object' && !Array.isArray(challenge.currentStep)
    ? challenge.currentStep as Record<string, unknown>
    : null;
  const firstStep = steps[0] && typeof steps[0] === 'object' && !Array.isArray(steps[0]) ? steps[0] as Record<string, unknown> : null;
  const startDateValue = currentStep?.startDate ?? firstStep?.startDate ?? '';
  const startDate = parseDate(String(startDateValue).trim());
  const industries = Array.isArray(challenge.industries)
    ? challenge.industries
        .map((industry) => {
          if (!industry || typeof industry !== 'object' || Array.isArray(industry)) {
            return '';
          }

          const item = industry as Record<string, unknown>;
          return String(item.title ?? '').trim();
        })
        .filter(Boolean)
    : [];

  if (!id || !slug || !name || !sourceUrl) {
    return [];
  }

  return [{
    title: name,
    description: shortDescription || name,
    sourceUrl,
    sourceId: id,
    source: 'taikai',
    imageUrl: imageUrl || undefined,
    organizerName: orgName || undefined,
    startDate,
    prizeText: formatPrizeText(challenge.prize, challenge.prizeCurrency),
    participantCount: toIntegerOrUndefined(challenge.participantsCount),
    locationText: industries.join(', ') || undefined,
    rawData: {
      challenge,
    },
  }];
}

function buildSourceUrl(orgSlug: string, slug: string): string {
  if (orgSlug && slug) {
    return `https://taikai.network/en/${orgSlug}/hackathons/${slug}/overview`;
  }

  return slug ? `https://taikai.network/en/hackathons/${slug}` : 'https://taikai.network/en/hackathons';
}

function extractImageUrl(challenge: Record<string, unknown>): string | undefined {
  const cardImageFile = challenge.cardImageFile && typeof challenge.cardImageFile === 'object' && !Array.isArray(challenge.cardImageFile)
    ? challenge.cardImageFile as Record<string, unknown>
    : null;
  const logoImageFile = challenge.logoImageFile && typeof challenge.logoImageFile === 'object' && !Array.isArray(challenge.logoImageFile)
    ? challenge.logoImageFile as Record<string, unknown>
    : null;
  return String(cardImageFile?.url ?? logoImageFile?.url ?? '').trim() || undefined;
}

function formatPrize(prize: unknown, currency: unknown): string | undefined {
  const amount = toIntegerOrUndefined(prize);
  if (amount === undefined) {
    return undefined;
  }

  const currencyName = String((currency as Record<string, unknown> | null)?.name ?? '').trim();
  return currencyName ? `$${amount.toLocaleString()} ${currencyName}` : `$${amount.toLocaleString()}`;
}

function formatPrizeText(prize: unknown, currency: unknown): string | undefined {
  return formatPrize(prize, currency);
}

function parseDate(value: string): Date | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function toIntegerOrUndefined(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.trunc(value);
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.replace(/,/g, '').trim());
    return Number.isNaN(parsed) ? undefined : Math.trunc(parsed);
  }

  return undefined;
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
    return new URL(trimmed, 'https://taikai.network').toString();
  } catch {
    return trimmed;
  }
}

function looksLikeHackathon(title: string, url: string): boolean {
  const lowerTitle = title.toLowerCase();
  const lowerUrl = url.toLowerCase();
  return lowerUrl.includes('taikai.network') && (lowerTitle.includes('hack') || lowerUrl.includes('/hackathon') || lowerUrl.includes('/hackathons'));
}
