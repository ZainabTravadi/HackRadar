import axios from 'axios';
import * as cheerio from 'cheerio';
import type { Element } from 'domhandler';
import { eq } from 'drizzle-orm';

import { db } from '../db';
import { scrapeLogs } from '../db/schema';
import { type RawHackathon } from '../pipeline/normalizer';
import { upsertHackathon } from './devpost';

const MLH_EVENTS_URL = 'https://mlh.io/seasons/2026/events';
const REQUEST_TIMEOUT_MS = 15_000;
const SOURCE = 'mlh';
const DEFAULT_YEAR = 2026;

const MONTH_PATTERN =
  /(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|SEPT|OCT|NOV|DEC)[A-Z]*\s+\d{1,2}(?:\s*-\s*(?:\d{1,2}|(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|SEPT|OCT|NOV|DEC)[A-Z]*\s+\d{1,2}))?(?:,\s*\d{4})?/i;
const MODE_MARKERS = ['IN-PERSON', 'DIGITAL', 'HYBRID', 'DIVERSITY', 'HIGH SCHOOL'];

interface ParsedCard {
  title: string;
  dateText: string;
  location: string;
  sourceUrl: string;
  sourceId: string;
  imageUrl?: string;
  registrationDeadline?: Date;
}

export async function scrapeMLH(): Promise<void> {
  console.info('[MLH] Starting scrape job...');

  const insertedLog = await db.insert(scrapeLogs).values({ source: SOURCE }).returning({ id: scrapeLogs.id });
  const scrapeLogId = insertedLog[0]?.id;

  let totalFound = 0;
  let totalNew = 0;
  let totalUpdated = 0;

  try {
    const html = await fetchMlhHtml();
    const parsed = extractMlhEvents(html);
    totalFound = parsed.length;

    console.info(`[MLH] Total events found: ${totalFound}`);

    for (const event of parsed) {
      const raw = mapToRawHackathon(event);

      try {
        const outcome = await upsertHackathon(raw);
        if (outcome === 'new') {
          totalNew += 1;
          console.info(`[MLH] Inserted new hackathon: ${raw.title}`);
        } else if (outcome === 'updated') {
          totalUpdated += 1;
          console.info(`[MLH] Updated hackathon: ${raw.title}`);
        }
      } catch (error: unknown) {
        console.error(`[MLH] Upsert failed for ${raw.sourceUrl}: ${toErrorMessage(error)}`);
      }
    }

    if (scrapeLogId) {
      await db
        .update(scrapeLogs)
        .set({
          completedAt: new Date(),
          recordsFound: totalFound,
          recordsNew: totalNew,
          recordsUpdated: totalUpdated,
          success: true,
          errorMessage: null,
        })
        .where(eq(scrapeLogs.id, scrapeLogId));
    }

    console.info(
      `[MLH] Scrape complete. found=${totalFound}, new=${totalNew}, updated=${totalUpdated}, skipped=${Math.max(totalFound - totalNew - totalUpdated, 0)}`,
    );
  } catch (error: unknown) {
    const message = toErrorMessage(error);
    console.error(`[MLH] Scrape job failed: ${message}`);

    if (scrapeLogId) {
      await db
        .update(scrapeLogs)
        .set({
          completedAt: new Date(),
          recordsFound: totalFound,
          recordsNew: totalNew,
          recordsUpdated: totalUpdated,
          success: false,
          errorMessage: message,
        })
        .where(eq(scrapeLogs.id, scrapeLogId));
    }

    throw error;
  }
}

export { scrapeMLH as scrapeMlh };

async function fetchMlhHtml(): Promise<string> {
  const response = await axios.get<string>(MLH_EVENTS_URL, {
    timeout: REQUEST_TIMEOUT_MS,
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml',
    },
    responseType: 'text',
  });

  return response.data;
}

function extractMlhEvents(html: string): ParsedCard[] {
  const $ = cheerio.load(html);
  const bySourceId = new Map<string, ParsedCard>();

  $('a[href]').each((_index, element) => {
    const href = ($(element).attr('href') ?? '').trim();
    if (!isMlhEventHref(href)) {
      return;
    }

    const sourceUrl = toAbsoluteUrl(href);
    if (!sourceUrl) {
      return;
    }

    const sourceId = extractSourceId(sourceUrl);
    if (!sourceId || bySourceId.has(sourceId)) {
      return;
    }

    const text = normalizeText($(element).text());
    const dateText = extractDateText(text);
    const title = extractTitle($(element), text, sourceId, dateText);

    if (!title) {
      return;
    }

    const location = extractLocation(text, dateText);
    const imageUrl = extractImageUrl($, element);

    bySourceId.set(sourceId, {
      title,
      dateText,
      location,
      sourceUrl,
      sourceId,
      imageUrl,
      registrationDeadline: parseRegistrationDeadline(dateText),
    });
  });

  return Array.from(bySourceId.values());
}

function isMlhEventHref(href: string): boolean {
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
    return false;
  }

  return href.includes('utm_campaign=events') || href.includes('events.mlh.io/events/');
}

function extractTitle(element: cheerio.Cheerio<Element>, text: string, sourceId: string, dateText: string): string {
  const ariaLabel = normalizeText(element.attr('aria-label') ?? '');
  if (ariaLabel && !isBoilerplateTitle(ariaLabel)) {
    return ariaLabel;
  }

  const titleAttr = normalizeText(element.attr('title') ?? '');
  if (titleAttr && !isBoilerplateTitle(titleAttr)) {
    return titleAttr;
  }

  const heading = normalizeText(element.find('h1, h2, h3, h4, strong').first().text());
  if (heading) {
    return heading;
  }

  const imageAlt = normalizeText(element.find('img').first().attr('alt') ?? '');
  if (imageAlt && !/^(image|logo)$/i.test(imageAlt)) {
    return imageAlt;
  }

  const prefix = dateText ? text.slice(0, Math.max(text.indexOf(dateText), 0)).trim() : text;
  const cleanedPrefix = normalizeText(prefix.replace(/\bbackground\b/gi, ''));
  const collapsed = collapseDuplicateWords(cleanedPrefix);
  if (collapsed) {
    return collapsed;
  }

  return fromSlug(sourceId);
}

function isBoilerplateTitle(value: string): boolean {
  const lower = value.toLowerCase();
  return lower === 'major league hacking' || lower === 'mlh';
}

function extractDateText(text: string): string {
  const match = text.match(MONTH_PATTERN);
  return match ? normalizeText(match[0]) : '';
}

function extractLocation(text: string, dateText: string): string {
  if (!dateText) {
    return '';
  }

  const start = text.indexOf(dateText);
  if (start < 0) {
    return '';
  }

  let tail = normalizeText(text.slice(start + dateText.length));
  for (const marker of MODE_MARKERS) {
    const markerIndex = tail.indexOf(marker);
    if (markerIndex >= 0) {
      tail = tail.slice(0, markerIndex).trim();
      break;
    }
  }

  return tail;
}

function extractImageUrl($: cheerio.CheerioAPI, element: Element): string | undefined {
  const src = $(element).find('img').first().attr('src');
  if (!src) {
    return undefined;
  }

  return toAbsoluteUrl(src) ?? undefined;
}

function mapToRawHackathon(event: ParsedCard): RawHackathon {
  const description = event.dateText ? `MLH hackathon: ${event.dateText}` : 'MLH hackathon event';

  return {
    title: event.title,
    description,
    sourceUrl: event.sourceUrl,
    sourceId: event.sourceId,
    source: SOURCE,
    imageUrl: event.imageUrl,
    registrationDeadline: event.registrationDeadline,
    locationText: event.location || undefined,
    rawData: {
      provider: 'mlh',
      dateText: event.dateText,
      location: event.location,
      extractedAt: new Date().toISOString(),
    },
  };
}

function parseRegistrationDeadline(dateText: string): Date | undefined {
  if (!dateText) {
    return undefined;
  }

  const upper = dateText.toUpperCase();
  const monthMatch = upper.match(/(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|SEPT|OCT|NOV|DEC)[A-Z]*/);
  if (!monthMatch) {
    return undefined;
  }

  const monthIndex = toMonthIndex(monthMatch[1]);
  if (monthIndex < 0) {
    return undefined;
  }

  const dayNumbers = Array.from(upper.matchAll(/\b(\d{1,2})\b/g)).map((match) => Number(match[1]));
  if (dayNumbers.length === 0) {
    return undefined;
  }

  const selectedDay = Math.max(...dayNumbers);
  const yearMatch = upper.match(/\b(20\d{2})\b/);
  const year = yearMatch ? Number(yearMatch[1]) : DEFAULT_YEAR;

  const parsed = new Date(Date.UTC(year, monthIndex, selectedDay, 23, 59, 59));
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function toMonthIndex(month: string): number {
  const normalized = month.slice(0, 3).toUpperCase();
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  return months.indexOf(normalized);
}

function extractSourceId(sourceUrl: string): string {
  try {
    const parsed = new URL(sourceUrl);
    const segments = parsed.pathname.split('/').filter((segment) => segment.length > 0);

    if (segments.length > 0) {
      return segments[segments.length - 1].toLowerCase();
    }

    return parsed.hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return '';
  }
}

function toAbsoluteUrl(url: string): string | null {
  try {
    return new URL(url, MLH_EVENTS_URL).toString();
  } catch {
    return null;
  }
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function collapseDuplicateWords(value: string): string {
  if (!value) {
    return '';
  }

  const words = value.split(' ');
  if (words.length < 6) {
    return value;
  }

  const half = Math.floor(words.length / 2);
  const firstHalf = words.slice(0, half).join(' ');
  const secondHalf = words.slice(half).join(' ');

  if (firstHalf === secondHalf) {
    return firstHalf;
  }

  return value;
}

function fromSlug(slug: string): string {
  return slug
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}
