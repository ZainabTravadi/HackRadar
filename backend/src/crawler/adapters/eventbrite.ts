import * as cheerio from 'cheerio';

import { BaseAdapter } from './baseAdapter';
import { cleanHackathonDescription, cleanHackathonTitle, inferHackathonOrganizer } from '../../pipeline/qualityCleanup';

export class EventbriteAdapter extends BaseAdapter {
  public readonly id = 'eventbrite';
  public readonly name = 'Eventbrite';

  constructor() {
    super({
      id: 'eventbrite',
      name: 'Eventbrite',
      baseUrl: 'https://www.eventbrite.com',
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
    return ['https://www.eventbrite.com/d/online/hackathon/'];
  }

  protected override createRawHackathons(payload: unknown): ReturnType<BaseAdapter['createRawHackathons']> {
    if (typeof payload !== 'string' || !payload.trim()) {
      return [];
    }

    const $ = cheerio.load(payload);
    const items: ReturnType<BaseAdapter['createRawHackathons']> = [];
    const seen = new Set<string>();

    $('a[href]').each((_, element) => {
      const anchor = $(element);
      const href = normalizeUrl(anchor.attr('href'));
      if (!href || !isValidEventUrl(href) || seen.has(href)) {
        return;
      }

      const card = anchor.closest('article, li, div, section');
      const titleCandidate = firstNonEmpty(
        cleanText(anchor.attr('aria-label')),
        cleanText(anchor.attr('title')),
        cleanText(card.find('h1, h2, h3').first().text()),
        cleanText(anchor.text()),
      );

      const normalizedTitleCandidate = normalizeEventbriteTitle(titleCandidate);
      const title = cleanHackathonTitle(normalizedTitleCandidate, {
        href,
        title: normalizedTitleCandidate,
        titleAttr: cleanText(anchor.attr('title')),
        ariaLabel: cleanText(anchor.attr('aria-label')),
      }, href);

      if (!title) {
        return;
      }

      const locationText = firstNonEmpty(
        cleanText(card.find('[data-testid*="location"]').first().text()),
        cleanText(card.find('[data-testid*="venue"]').first().text()),
        cleanText(card.find('[itemprop="location"]').first().text()),
      );

      const organizerText = firstNonEmpty(
        cleanText(card.find('[data-testid*="organizer"]').first().text()),
        extractOrganizedBy(cleanText(card.text())),
      );

      const timeText = firstNonEmpty(
        cleanText(card.find('time').first().attr('datetime')),
        cleanText(card.find('time').first().text()),
        cleanText(card.find('[data-testid*="date"]').first().text()),
      );

      const structuredDescription = [locationText, organizerText ? `Hosted by ${organizerText}` : '', timeText]
        .filter(Boolean)
        .join(' | ');

      const rawData = {
        html: payload.slice(0, 1800),
        href,
        title,
        titleCandidate: normalizedTitleCandidate,
        locationText,
        organizerText,
        timeText,
        cardLabel: cleanText(anchor.attr('aria-label')),
        cardTitle: cleanText(anchor.attr('title')),
      };

      const cleanDescription = cleanHackathonDescription(structuredDescription, title, rawData);
      const organizerName = inferHackathonOrganizer({
        title,
        description: cleanDescription || title,
        sourceUrl: href,
        sourceId: href,
        source: 'eventbrite',
        organizerName: organizerText || undefined,
        locationText: locationText || undefined,
        rawData,
      }, cleanDescription || title, locationText);

      seen.add(href);
      items.push({
        title,
        description: cleanDescription || title,
        sourceUrl: href,
        sourceId: href,
        source: 'eventbrite',
        organizerName: organizerName || organizerText || undefined,
        locationText: locationText || undefined,
        rawData,
      });
    });

    return items.slice(0, 25);
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
    return new URL(trimmed, 'https://www.eventbrite.com').toString();
  } catch {
    return trimmed;
  }
}

function isValidEventUrl(url: string): boolean {
  if (!/^https?:\/\/(www\.)?eventbrite\.com\/e\/[^/]+/i.test(url)) {
    return false;
  }

  return ![
    /eventbrite\.com\/d\//i,
    /eventbrite\.com\/pricing/i,
    /eventbrite\.com\/contact/i,
    /eventbrite\.com\/community/i,
    /eventbrite\.com\/help/i,
    /eventbrite\.com\/blog/i,
    /eventbrite\.com\/news/i,
    /eventbrite\.com\/find/i,
    /eventbrite\.com\/qr/i,
    /eventbrite\.com\/assets/i,
    /eventbrite\.com\/static/i,
    /eventbrite\.com\/about/i,
    /eventbrite\.com\/careers/i,
    /eventbrite\.com\/press/i,
    /eventbrite\.com\/privacy/i,
    /eventbrite\.com\/terms/i,
    /eventbrite\.com\/cookies/i,
    /eventbrite\.com\/accessibility/i,
    /eventbrite\.com\/sitemap/i,
    /facebook\.com/i,
    /instagram\.com/i,
    /tiktok\.com/i,
    /twitter\.com/i,
    /linkedin\.com/i,
    /youtube\.com/i,
  ].some((pattern) => pattern.test(url));
}

function cleanText(value: string | undefined): string {
  if (!value) {
    return '';
  }

  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function firstNonEmpty(...values: Array<string | undefined>): string {
  for (const value of values) {
    const cleaned = cleanText(value);
    if (cleaned) {
      return cleaned;
    }
  }

  return '';
}

function extractOrganizedBy(text: string): string {
  const match = text.match(/(?:hosted by|organized by|organised by|presented by|powered by|by)\s+([^|:.-]{2,80}?)(?=$|[|:.-]\s|,|\(|\)|\d{4}\b)/i);
  return match?.[1]?.trim() ?? '';
}

function normalizeEventbriteTitle(value: string): string {
  return value
    .replace(/^(?:view|save this event|share this event|sales end soon|just added|tomorrow|today)\b[\s:|.-]*/i, '')
    .replace(/^[\s|:.-]+/, '')
    .replace(/[|.-]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}
