import * as cheerio from 'cheerio';

import type { RawHackathon } from '../../../pipeline/normalizer';

const HACKEREARTH_EVENT_PATTERNS = [
  /hackerearth\.com\/hackathon\/[a-z0-9-]+/i,
  /hackerearth\.com\/challenge\/[a-z0-9-]+/i,
  /hackerearth\.com\/competitions\/[a-z0-9-]+/i,
];
const HACKEREARTH_REJECT_PATTERNS = [
  /hackerearth\.com\/login/i,
  /hackerearth\.com\/signup/i,
  /hackerearth\.com\/signin/i,
  /hackerearth\.com\/logout/i,
  /hackerearth\.com\/register/i,
  /hackerearth\.com\/competitive/i,
  /hackerearth\.com\/hiring/i,
  /hackerearth\.com\/university/i,
  /hackerearth\.com\/practice/i,
  /hackerearth\.com\/challenges\/?$/i,
  /hackerearth\.com\/hackathons\/?$/i,
  /hackerearth\.com\/competitions\/?$/i,
  /hackerearth\.com\/assets\//i,
  /hackerearth\.com\/static\//i,
  /hackerearth\.com\/images\//i,
  /hackerearth\.com\/media\//i,
  /hackerearth\.com\/api\//i,
  /hackerearth\.com\/blog/i,
  /hackerearth\.com\/about/i,
  /hackerearth\.com\/careers/i,
  /hackerearth\.com\/pricing/i,
  /hackerearth\.com\/contact/i,
  /hackerearth\.com\/help/i,
  /hackerearth\.com\/support/i,
  /\.svg$/i,
  /\.png$/i,
  /\.jpg$/i,
  /\.jpeg$/i,
  /\.gif$/i,
  /\.webp$/i,
  /\.js$/i,
  /\.css$/i,
];

function isValidHackerEarthEventUrl(url: string): boolean {
  const lowerUrl = url.toLowerCase();
  const hasValidPattern = HACKEREARTH_EVENT_PATTERNS.some((p) => p.test(lowerUrl));
  if (!hasValidPattern) {
    return false;
  }
  for (const pattern of HACKEREARTH_REJECT_PATTERNS) {
    if (pattern.test(lowerUrl)) {
      return false;
    }
  }
  return true;
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

export function parseHackerEarthPayload(html: string): RawHackathon[] {
  const $ = cheerio.load(html);
  const items: RawHackathon[] = [];
  const seen = new Set<string>();

  $('a[href]').each((_, element) => {
    const href = $(element).attr('href');
    const title = $(element).text().trim() || $(element).attr('aria-label') || '';
    const normalizedUrl = normalizeUrl(href);

    if (!normalizedUrl || !isValidHackerEarthEventUrl(normalizedUrl)) {
      return;
    }

    if (seen.has(normalizedUrl)) {
      return;
    }

    seen.add(normalizedUrl);

    const cleanTitle = title.length > 80 ? title.slice(0, 77) + '...' : title || 'HackerEarth challenge';

    items.push({
      title: cleanTitle,
      description: `HackerEarth challenge from ${normalizedUrl}`,
      sourceUrl: normalizedUrl,
      sourceId: normalizedUrl,
      source: 'hackerearth',
      rawData: { html: html.slice(0, 1400), href: normalizedUrl },
    });
  });

  return items.slice(0, 25);
}