import * as cheerio from 'cheerio';

import { BaseAdapter } from './baseAdapter';
import type { RawResponseSnapshot } from '../core/types';

export class ReskilllAdapter extends BaseAdapter {
  public readonly id = 'reskilll';
  public readonly name = 'Reskilll';

  constructor() {
    super({
      id: 'reskilll',
      name: 'Reskilll',
      baseUrl: 'https://reskilll.com',
      delayMs: 1000,
      concurrency: 1,
      retryAfterMs: 1500,
      timeoutMs: 20_000,
      enableProxy: false,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      headers: { Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' },
      maxPages: 1,
      detailPageLimit: 25,
      crawlType: 'html',
      sourceType: 'generic',
    });
  }

  protected override listingUrls(): string[] {
    return ['https://reskilll.com/allhacks'];
  }

  protected override createRawHackathons(payload: unknown): ReturnType<BaseAdapter['createRawHackathons']> {
    if (typeof payload !== 'string') {
      return [];
    }

    const $ = cheerio.load(payload);
    const items: ReturnType<BaseAdapter['createRawHackathons']> = [];
    const seen = new Set<string>();

    $('div.hackathonCard').each((_, element) => {
      const card = $(element);
      const link = card.find('a.eventName[href]').first();
      const sourceUrl = normalizeUrl(link.attr('href'));
      const title = link.text().trim().replace(/\s+/g, ' ');
      const description = card.find('.eventDescription').text().trim().replace(/\s+/g, ' ');
      const imageUrl = card.find('img').first().attr('src')?.trim() || undefined;
      const dates = card.find('.hackresgiterdate');
      const registrationStart = parseDate(dates.eq(0).text().trim());
      const registrationEnd = parseDate(dates.eq(1).text().trim());

      if (!sourceUrl || !title || seen.has(sourceUrl)) {
        return;
      }

      seen.add(sourceUrl);
      items.push({
        title,
        description: description || title,
        sourceUrl,
        sourceId: sourceUrl,
        source: 'reskilll',
        imageUrl,
        registrationDeadline: registrationEnd,
        startDate: registrationStart,
        rawData: {
          html: payload.slice(0, 2000),
          sourceUrl,
          title,
        },
      });
    });

    return items;
  }

  protected override async fetchWithRetry(url: string): Promise<RawResponseSnapshot> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const startedAt = Date.now();
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);

        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'User-Agent': this.config.userAgent,
              ...(this.config.headers ?? {}),
            },
            signal: controller.signal,
          });

          const rawHtml = await response.text();
          const headers = Object.fromEntries(response.headers.entries());

          return {
            url: response.url || url,
            method: 'GET',
            statusCode: response.status,
            responseTimeMs: Date.now() - startedAt,
            timestamp: new Date().toISOString(),
            headers,
            rawHtml,
          };
        } finally {
          clearTimeout(timeout);
        }
      } catch (error) {
        lastError = error;
        if (attempt < 3) {
          await this.delay(this.config.retryAfterMs * attempt);
        }
      }
    }

    throw lastError instanceof Error ? lastError : new Error(String(lastError));
  }
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
    return new URL(trimmed, 'https://reskilll.com').toString();
  } catch {
    return trimmed;
  }
}

function parseDate(value: string): Date | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}
