import * as cheerio from 'cheerio';

import { BaseAdapter } from './baseAdapter';

export class AngelHackAdapter extends BaseAdapter {
  public readonly id = 'angelhack';
  public readonly name = 'AngelHack';

  constructor() {
    super({
      id: 'angelhack',
      name: 'AngelHack',
      baseUrl: 'https://angelhack.com',
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
    return ['https://angelhack.com/events'];
  }

  protected override createRawHackathons(payload: unknown): ReturnType<BaseAdapter['createRawHackathons']> {
    if (typeof payload !== 'string') {
      return [];
    }

    const $ = cheerio.load(payload);
    const items: ReturnType<BaseAdapter['createRawHackathons']> = [];
    const seen = new Set<string>();

    $('a[href^="https://angelhack.com/event/"], a[href^="/event/"]').each((_, element) => {
      const card = $(element);
      const title = card.find('h2').first().text().trim().replace(/\s+/g, ' ');
      const sourceUrl = normalizeUrl(card.attr('href'));
      const cardText = card.text().replace(/\s+/g, ' ').trim();
      const imageUrl = card.find('img').first().attr('src')?.trim() || undefined;
      const dates = cardText.match(/\b\d{2}\s+[A-Z][a-z]{2}\s+\d{4}\b/g) ?? [];
      const startDate = parseDate(dates[0]);
      const registrationDeadline = parseDate(dates[1]);

      if (!title || !sourceUrl || seen.has(sourceUrl) || !cardText.toLowerCase().includes('hackathon')) {
        return;
      }

      seen.add(sourceUrl);
      items.push({
        title,
        description: cardText.slice(0, 500),
        sourceUrl,
        sourceId: sourceUrl,
        source: 'angelhack',
        imageUrl,
        registrationDeadline,
        startDate,
        rawData: {
          html: payload.slice(0, 3000),
          title,
          sourceUrl,
        },
      });
    });

    return items;
  }
}

function normalizeUrl(href: string | undefined): string | null {
  if (!href) {
    return null;
  }

  try {
    return new URL(href, 'https://angelhack.com').toString();
  } catch {
    return null;
  }
}

function parseDate(value: string | undefined): Date | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}
