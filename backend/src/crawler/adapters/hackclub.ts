import * as cheerio from 'cheerio';

import { BaseAdapter } from './baseAdapter';

export class HackClubAdapter extends BaseAdapter {
  public readonly id = 'hackclub';
  public readonly name = 'Hack Club';

  constructor() {
    super({
      id: 'hackclub',
      name: 'Hack Club',
      baseUrl: 'https://hackclub.com',
      delayMs: 1000,
      concurrency: 1,
      retryAfterMs: 1500,
      timeoutMs: 20_000,
      enableProxy: false,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      headers: { Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' },
      maxPages: 3,
      detailPageLimit: 25,
      crawlType: 'html',
      sourceType: 'generic',
    });
  }

  protected override listingUrls(): string[] {
    return ['https://hackathons.hackclub.com/'];
  }

  protected override createRawHackathons(payload: unknown): ReturnType<BaseAdapter['createRawHackathons']> {
    if (typeof payload !== 'string') {
      return [];
    }

    const $ = cheerio.load(payload);
    const items: ReturnType<BaseAdapter['createRawHackathons']> = [];
    const seen = new Set<string>();

    $('a[itemtype="http://schema.org/Event"]').each((_, element) => {
      const card = $(element);
      const title = card.find('h3[itemprop="name"]').first().text().trim().replace(/\s+/g, ' ');
      const href = card.attr('href')?.trim();
      const sourceUrl = normalizeUrl(href);
      const imageUrl = card.find('img').first().attr('src')?.trim() || undefined;
      const mode = card.find('span[itemtype="VirtualLocation"]').first().text().trim();
      const location = card.find('span[itemprop="address"]').first().parent().text().replace(/\s+/g, ' ').trim();
      const startDate = parseDate(card.find('span[itemprop="startDate"]').attr('content') ?? '');
      const endDate = parseDate(card.find('span[itemprop="endDate"]').attr('content') ?? '');
      const footerText = card.find('footer').text().trim();
      const description = [title, mode || location, footerText].filter(Boolean).join(' • ').slice(0, 500);

      if (!title || !sourceUrl || seen.has(sourceUrl)) {
        return;
      }

      seen.add(sourceUrl);
      items.push({
        title,
        description: description || title,
        sourceUrl,
        sourceId: sourceUrl,
        source: 'hackclub',
        imageUrl,
        startDate,
        endDate,
        locationText: location || undefined,
        rawData: {
          html: payload.slice(0, 3000),
          title,
          sourceUrl,
        },
      });
    });

    return items.slice(0, 25);
  }
}

function normalizeUrl(href: string | undefined): string | null {
  if (!href) {
    return null;
  }

  try {
    return new URL(href, 'https://hackathons.hackclub.com').toString();
  } catch {
    return null;
  }
}

function parseDate(value: string): Date | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}
