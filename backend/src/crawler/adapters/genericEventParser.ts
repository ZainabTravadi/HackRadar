import * as cheerio from 'cheerio';

import type { RawHackathon } from '../../pipeline/normalizer';
import { cleanHackathonDescription, cleanHackathonTitle, inferHackathonOrganizer } from '../../pipeline/qualityCleanup';

interface GenericParserOptions {
  baseUrl: string;
  sourceName: string;
  urlPatterns?: RegExp[];
  rejectPatterns?: RegExp[];
  maxItems?: number;
}

export function parseGenericListingHtml(
  payload: unknown,
  source: RawHackathon['source'],
  options: GenericParserOptions,
): RawHackathon[] {
  if (typeof payload !== 'string' || !payload.trim()) {
    return [];
  }

  const $ = cheerio.load(payload);
  const items: RawHackathon[] = [];
  const seen = new Set<string>();
  const maxItems = options.maxItems ?? 25;

  const acceptPatterns = options.urlPatterns ?? [];
  const rejectPatterns = options.rejectPatterns ?? [];

  $('a[href]').each((_, element) => {
    const anchor = $(element);
    const href = normalizeUrl(anchor.attr('href'), options.baseUrl);
    const title = cleanText(anchor.text()) || cleanText(anchor.attr('aria-label')) || cleanText(anchor.attr('title'));
    const description = cleanText(anchor.closest('li, div, article, section, p').text()) || title;
    const cardText = cleanText(anchor.closest('li, div, article, section, p').text());
    const organizerText = cleanText(anchor.attr('data-organizer') || anchor.attr('data-host') || anchor.attr('data-creator'));
    const locationText = cleanText(anchor.attr('data-location') || anchor.attr('data-venue'));

    if (!href || !title || seen.has(href) || isLikelyNoise(title, href)) {
      return;
    }

    if (acceptPatterns.length > 0 && !acceptPatterns.some((pattern) => pattern.test(href))) {
      return;
    }

    if (rejectPatterns.some((pattern) => pattern.test(href))) {
      return;
    }

    const lowerTitle = title.toLowerCase();
    const lowerHref = href.toLowerCase();
    const hasEventSignals = /hack(athon|athons)?|challenge|summit|contest|jam|meetup|conference|camp|demo|build/i.test(lowerTitle) || /\/hack(athon|athons)?|\/challenge|\/events?|\/meetup|\/conference|\/contest/i.test(lowerHref);

    if (!hasEventSignals && acceptPatterns.length === 0) {
      return;
    }

    seen.add(href);
    const rawData = {
      html: payload.slice(0, 1800),
      href,
      sourceName: options.sourceName,
      cardText,
      title,
      organizerText,
      locationText,
      ariaLabel: cleanText(anchor.attr('aria-label')),
      titleAttr: cleanText(anchor.attr('title')),
    };
    const cleanedTitle = cleanHackathonTitle(title, rawData, href);
    const cleanedDescription = cleanHackathonDescription(description || title, cleanedTitle, rawData);
    const organizerName = inferHackathonOrganizer({
      title: cleanedTitle,
      description: cleanedDescription || cleanedTitle,
      sourceUrl: href,
      sourceId: href,
      source,
      organizerName: organizerText || undefined,
      locationText: locationText || undefined,
      rawData,
    }, cleanedDescription || cleanedTitle, locationText);

    items.push({
      title: truncate(cleanedTitle || `${options.sourceName} event`),
      description: truncate(cleanedDescription || cleanedTitle || `${options.sourceName} event`),
      sourceUrl: href,
      sourceId: href,
      source,
      organizerName: organizerName || organizerText || undefined,
      locationText: locationText || undefined,
      rawData,
    });
  });

  return items.slice(0, maxItems);
}

function normalizeUrl(href: string | undefined, baseUrl: string): string | null {
  if (!href) {
    return null;
  }

  const trimmed = href.trim();
  if (!trimmed || trimmed.startsWith('javascript:') || trimmed.startsWith('mailto:')) {
    return null;
  }

  try {
    return new URL(trimmed, baseUrl).toString();
  } catch {
    return trimmed;
  }
}

function cleanText(value: string | undefined): string {
  if (!value) {
    return '';
  }

  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function cleanTitle(value: string): string {
  return cleanText(value)
    .replace(/^(?:view|save this event|share this event|sales end soon|just added|tomorrow at|today at)\b/i, '')
    .replace(/^[\s•|:\-]+/, '')
    .replace(/[|•\-]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanDescription(value: string, sourceName: string): string {
  const cleaned = cleanText(value)
    .replace(/^(?:view|save this event|share this event|sales end soon|just added|tomorrow at|today at)\b/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) {
    return `${sourceName} event`;
  }

  return cleaned.length > 220 ? `${cleaned.slice(0, 217)}...` : cleaned;
}

function truncate(value: string): string {
  return value.length > 120 ? `${value.slice(0, 117)}...` : value;
}

function isLikelyNoise(title: string, href: string): boolean {
  const lowerTitle = title.toLowerCase();
  const lowerHref = href.toLowerCase();
  const blockedTerms = ['login', 'signup', 'pricing', 'docs', 'documentation', 'blog', 'news', 'privacy', 'terms', 'contact', 'support', 'resources', 'community', 'jobs', 'careers', 'about', 'help', 'faq', 'sitemap', 'press', 'media', 'partners', 'sponsors', 'advertise', 'api', 'developers', 'status', 'changelog', 'cookies', 'accessibility', 'legal'];
  const blockedPaths = ['/api/', '/assets/', '/static/', '/images/', '/img/', '/media/', '/javascript:', '/cdn-cgi/', '/_next/', '/_nuxt/'];

  return blockedTerms.some((term) => lowerTitle.includes(term) || lowerHref.includes(term)) || blockedPaths.some((path) => lowerHref.includes(path));
}
