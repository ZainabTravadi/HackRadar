import * as cheerio from 'cheerio';

import type { RawHackathon } from '../../../pipeline/normalizer';

export function parseDoraHacksPayload(html: string): RawHackathon[] {
  const $ = cheerio.load(html);
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
    const surroundingText = $(element).closest('li, div, article, section, p').text().trim();
    const description = surroundingText && surroundingText.length > 12
      ? surroundingText.replace(/\s+/g, ' ').slice(0, 220)
      : `DoraHacks event from ${normalizedUrl}`;

    items.push({
      title: title.length > 80 ? title.slice(0, 77) + '...' : title || 'DoraHacks event',
      description,
      sourceUrl: normalizedUrl,
      sourceId: normalizedUrl,
      source: 'dorahacks',
      rawData: { html: html.slice(0, 1400), href: normalizedUrl },
    });
  });

  return items.slice(0, 25);
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
    return new URL(trimmed, 'https://dorahacks.io').toString();
  } catch {
    return trimmed;
  }
}

function looksLikeHackathon(title: string, url: string): boolean {
  const lowerTitle = title.toLowerCase();
  const lowerUrl = url.toLowerCase();
  return lowerUrl.includes('dorahacks.io') && (lowerTitle.includes('hack') || lowerUrl.includes('/hackathons/') || lowerUrl.includes('/hackathon/'));
}
