import * as cheerio from 'cheerio';
import { chromium } from 'playwright';

import { BaseAdapter } from './baseAdapter';
import type { RawResponseSnapshot } from '../core/types';

export class LablabAdapter extends BaseAdapter {
  public readonly id = 'lablab';
  public readonly name = 'lablab.ai';

  constructor() {
    super({
      id: 'lablab',
      name: 'lablab.ai',
      baseUrl: 'https://lablab.ai',
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
    return ['https://lablab.ai/event'];
  }

  protected override createRawHackathons(payload: unknown): ReturnType<BaseAdapter['createRawHackathons']> {
    if (typeof payload !== 'string') {
      return [];
    }

    const $ = cheerio.load(payload);
    const items: ReturnType<BaseAdapter['createRawHackathons']> = [];
    const seen = new Set<string>();

    $('a[href^="/ai-hackathons/"]').each((_, element) => {
      const card = $(element);
      const href = card.attr('href')?.trim();
      const sourceUrl = normalizeUrl(href);
      const title = extractTitle(card, sourceUrl);
      const description = card.find('p').first().text().trim().replace(/\s+/g, ' ');
      const imageUrl = card.find('img').first().attr('src')?.trim() || card.find('img').first().attr('srcset')?.split(' ').shift() || undefined;
      const startDate = parseDate(card.find('time').first().attr('datetime') ?? '');

      if (!sourceUrl || !title || seen.has(sourceUrl)) {
        return;
      }

      seen.add(sourceUrl);
      items.push({
        title,
        description: description || title,
        sourceUrl,
        sourceId: sourceUrl,
        source: 'lablab',
        imageUrl,
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

  protected override async fetchWithRetry(url: string): Promise<RawResponseSnapshot> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      let browser = null;
      try {
        const startedAt = Date.now();
        browser = await chromium.launch({ headless: true });
        const context = await browser.newContext({
          userAgent: this.config.userAgent,
        });
        const page = await context.newPage();

        await page.goto('https://lablab.ai/ai-hackathons', { waitUntil: 'networkidle', timeout: this.config.timeoutMs });
        const rawHtml = await page.content();

        return {
          url: page.url(),
          method: 'GET',
          statusCode: 200,
          responseTimeMs: Date.now() - startedAt,
          timestamp: new Date().toISOString(),
          headers: {},
          rawHtml,
        };
      } catch (error) {
        lastError = error;
        if (attempt < 3) {
          await this.delay(this.config.retryAfterMs * attempt);
        }
      } finally {
        if (browser) {
          await browser.close();
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

  try {
    return new URL(href, 'https://lablab.ai').toString();
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

function extractTitle(card: cheerio.Cheerio<any>, sourceUrl: string | null): string {
  const candidates = [
    card.attr('aria-label'),
    card.attr('title'),
    card.find('h1, h2, h3').first().text(),
    sourceUrl ? new URL(sourceUrl).pathname.split('/').filter(Boolean).pop() : '',
  ];

  for (const candidate of candidates) {
    const cleaned = (candidate ?? '').replace(/\s+/g, ' ').trim();
    if (cleaned && !looksLikeCount(cleaned)) {
      return cleaned;
    }
  }

  return sourceUrl ? new URL(sourceUrl).pathname.split('/').filter(Boolean).pop()?.replace(/[-_]+/g, ' ').trim() ?? 'lablab.ai event' : 'lablab.ai event';
}

function looksLikeCount(value: string): boolean {
  return /^\d+(?:[.,]\d+)?$/.test(value) || /participant|participants|people|members/i.test(value);
}
