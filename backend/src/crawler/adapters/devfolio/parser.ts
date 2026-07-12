import * as cheerio from 'cheerio';

import type { RawHackathon } from '../../../pipeline/normalizer';

const DEVFOLIO_EVENT_PATTERN = /devfolio\.co\/hackathons\/[a-z0-9-]+$/i;
const DEVFOLIO_REJECT_PATTERNS = [
  /devfolio\.co\/hackathons\/?$/i,
  /devfolio\.co\/organize/i,
  /devfolio\.co\/explore/i,
  /devfolio\.co\/pricing/i,
  /devfolio\.co\/about/i,
  /devfolio\.co\/blog/i,
  /devfolio\.co\/help/i,
  /devfolio\.co\/careers/i,
  /devfolio\.co\/partners/i,
  /devfolio\.co\/assets\//i,
  /devfolio\.co\/static\//i,
  /devfolio\.co\/images\//i,
  /devfolio\.co\/_next\//i,
  /devfolio\.co\/api\//i,
  /\.svg$/i,
  /\.png$/i,
  /\.jpg$/i,
  /\.jpeg$/i,
  /\.gif$/i,
  /\.webp$/i,
  /\.js$/i,
  /\.css$/i,
];

function isValidDevfolioEventUrl(url: string): boolean {
  if (!DEVFOLIO_EVENT_PATTERN.test(url)) {
    return false;
  }
  for (const pattern of DEVFOLIO_REJECT_PATTERNS) {
    if (pattern.test(url)) {
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
    return new URL(trimmed, 'https://devfolio.co').toString();
  } catch {
    return trimmed;
  }
}

export function parseDevfolioPayload(html: string): RawHackathon[] {
  const $ = cheerio.load(html);
  const items: RawHackathon[] = [];
  const seen = new Set<string>();

  $('a[href]').each((_, element) => {
    const href = $(element).attr('href');
    const title = $(element).text().trim() || $(element).attr('aria-label') || '';
    const normalizedUrl = normalizeUrl(href);

    if (!normalizedUrl || !isValidDevfolioEventUrl(normalizedUrl)) {
      return;
    }

    if (seen.has(normalizedUrl)) {
      return;
    }

    seen.add(normalizedUrl);

    const cleanTitle = title.length > 80 ? title.slice(0, 77) + '...' : title || 'Devfolio hackathon';

    const surroundingText = $(element).closest('li, div, article, section, p').text().trim();
    const description = surroundingText && surroundingText.length > 12
      ? surroundingText.replace(/\s+/g, ' ').slice(0, 220)
      : `Devfolio event from ${normalizedUrl}`;

    items.push({
      title: cleanTitle,
      description,
      sourceUrl: normalizedUrl,
      sourceId: normalizedUrl,
      source: 'devfolio',
      rawData: { html: html.slice(0, 1400), href: normalizedUrl },
    });
  });

  return items.slice(0, 25);
}