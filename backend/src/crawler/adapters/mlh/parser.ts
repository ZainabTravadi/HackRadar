import type { RawHackathon } from '../../../pipeline/normalizer';

const MLH_EVENT_PATTERN = /events\.mlh\.io\/events\/[a-z0-9-]+/i;
const MLH_REJECT_PATTERNS = [
  /mlh\.io\/assets\//i,
  /mlh\.io\/static\//i,
  /mlh\.io\/images\//i,
  /mlh\.io\/img\//i,
  /mlh\.io\/css\//i,
  /mlh\.io\/js\//i,
  /mlh\.io\/fonts\//i,
  /mlh\.io\/discord/i,
  /mlh\.io\/careers/i,
  /mlh\.io\/sponsor/i,
  /mlh\.io\/about/i,
  /mlh\.io\/blog/i,
  /mlh\.io\/press/i,
  /mlh\.io\/resources/i,
  /mlh\.io\/seasons\/?$/i,
  /mlh\.io\/fellowship/i,
  /mlh\.io\/prime/i,
  /\.svg$/i,
  /\.png$/i,
  /\.jpg$/i,
  /\.jpeg$/i,
  /\.gif$/i,
  /\.webp$/i,
  /\.js$/i,
  /\.css$/i,
];

function isValidMlhEventUrl(url: string): boolean {
  if (!MLH_EVENT_PATTERN.test(url)) {
    return false;
  }
  for (const pattern of MLH_REJECT_PATTERNS) {
    if (pattern.test(url)) {
      return false;
    }
  }
  return true;
}

function extractTitleFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const pathParts = parsed.pathname.split('/').filter(Boolean);
    const eventSlug = pathParts[pathParts.length - 1];
    if (eventSlug) {
      return eventSlug.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
    }
  } catch {
    // ignore
  }
  return 'MLH event';
}

export function parseMlhPayload(html: string): RawHackathon[] {
  const matches = Array.from(html.matchAll(/https?:\/\/[^"'\s<>]+/g));
  const items: RawHackathon[] = [];
  const seen = new Set<string>();

  for (const match of matches) {
    const url = canonicalizeMlhUrl(match[0].replace(/[.,;)]+$/, ''));

    if (!isValidMlhEventUrl(url) || seen.has(url)) {
      continue;
    }

    seen.add(url);
    const title = extractTitleFromUrl(url);
    const organizerName = extractOrganizerFromHtml(html);

    items.push({
      title: title.length > 120 ? title.slice(0, 117) + '...' : title,
      description: `MLH event: ${title}`,
      sourceUrl: url,
      sourceId: url,
      source: 'mlh',
      organizerName: organizerName || undefined,
      rawData: { html: html.slice(0, 1200), url, organizerName },
    });
  }

  return items.slice(0, 25);
}

function canonicalizeMlhUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = '';
    parsed.search = '';
    parsed.hostname = parsed.hostname.replace(/^www\./, '').toLowerCase();
    parsed.pathname = parsed.pathname.replace(/\/+$/, '');
    return parsed.toString();
  } catch {
    return url;
  }
}

function extractOrganizerFromHtml(html: string): string {
  if (/Major League Hacking/i.test(html)) {
    return 'Major League Hacking';
  }

  const organizerMatch = html.match(/(?:hosted by|organized by|organised by|presented by)\s+([^<]{2,80}?)(?=<|$)/i);
  return organizerMatch?.[1]?.trim() ?? '';
}
