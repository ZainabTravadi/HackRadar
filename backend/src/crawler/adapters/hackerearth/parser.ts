import * as cheerio from 'cheerio';

import type { RawHackathon } from '../../../pipeline/normalizer';

export function parseHackerEarthPayload(html: string): RawHackathon[] {
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
    items.push({
      title: title.length > 80 ? title.slice(0, 77) + '...' : title || 'HackerEarth challenge',
      description: `HackerEarth challenge from ${normalizedUrl}`,
      sourceUrl: normalizedUrl,
      sourceId: normalizedUrl,
      source: 'hackerearth',
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
    return new URL(trimmed, 'https://www.hackerearth.com').toString();
  } catch {
    return trimmed;
  }
}

function looksLikeHackathon(title: string, url: string): boolean {
  const lowerTitle = title.toLowerCase();
  const lowerUrl = url.toLowerCase();
  return lowerUrl.includes('hackerearth.com') && (lowerTitle.includes('hack') || lowerUrl.includes('/hackathon') || lowerUrl.includes('/challenge'));
}
