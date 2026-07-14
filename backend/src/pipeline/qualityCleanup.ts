import type { RawHackathon } from './normalizer';

const GENERIC_TITLE_TERMS = [
  'view hackathon',
  'save this event',
  'share this event',
  'host a hackathon',
  'host a hackathons',
  'your hackathons',
  'my hackathons',
  'hackathons',
  'upcoming events',
  'past events',
  'all events',
  'upcoming hackathons',
  'past hackathons',
  'discover',
  'explore',
  'browse',
  'featured',
  'popular',
  'trending',
  'recommended',
  'for you',
  'just added',
  'sales end soon',
];

const TITLE_PREFIXES = [
  'view',
  'save this event',
  'share this event',
  'sales end soon',
  'just added',
  'tomorrow at',
  'today at',
  'this weekend',
  'this week',
  'next week',
  'next weekend',
  'starting soon',
];

const DESCRIPTION_PREFIXES = [
  'view',
  'save this event',
  'share this event',
  'sales end soon',
  'just added',
  'tomorrow at',
  'today at',
  'this weekend',
  'this week',
  'next week',
  'next weekend',
  'starting soon',
];

const ORGANIZER_KEYS = [
  'organizer',
  'organiser',
  'organizer_name',
  'organizerName',
  'organization',
  'organization_name',
  'organizationName',
  'host',
  'hostName',
  'host_name',
  'creator',
  'creatorName',
  'presenter',
  'presenterName',
  'company',
  'company_name',
  'venue',
  'venueName',
  'venue_name',
];

export function cleanHackathonTitle(rawTitle: string, rawData?: Record<string, unknown>, sourceUrl?: string): string {
  const candidates = [
    rawTitle,
    extractText(rawData, ['title', 'name', 'eventName', 'hackathonName', 'headline', 'shortTitle', 'cardText', 'pageTitle', 'page_title', 'metaTitle', 'ogTitle', 'og:title']),
    extractText(rawData, ['pageTitle', 'page_title', 'metaTitle', 'ogTitle', 'og:title']),
    extractUrlTitle(sourceUrl),
  ];

  for (const candidate of candidates) {
    const cleaned = normalizeText(candidate);
    if (cleaned && !isGenericTitle(cleaned)) {
      return cleaned;
    }
  }

  return normalizeText(rawTitle);
}

export function cleanHackathonDescription(rawDescription: string, title: string, rawData?: Record<string, unknown>): string {
  const candidates = [
    rawDescription,
    extractText(rawData, ['description', 'tagline', 'summary', 'shortDescription', 'excerpt', 'details', 'cardText']),
    extractText(rawData, ['body', 'content', 'text', 'html']),
  ];

  const cleanTitle = normalizeText(title);

  for (const candidate of candidates) {
    const cleaned = normalizeDescription(candidate);
    if (!cleaned) {
      continue;
    }

    if (isGenericDescription(cleaned) || cleaned.toLowerCase() === cleanTitle.toLowerCase()) {
      continue;
    }

    return cleaned;
  }

  return '';
}

export function inferHackathonOrganizer(raw: RawHackathon, description: string, location: string): string | null {
  const candidates = [
    raw.organizerName,
    extractText(raw.rawData, [...ORGANIZER_KEYS, 'cardText', 'description', 'summary', 'shortDescription', 'excerpt', 'details', 'body', 'content', 'text', 'html']),
    extractOrganizerFromText(description),
    extractOrganizerFromText(location),
    extractOrganizerFromText(extractText(raw.rawData, ['cardText', 'description', 'tagline', 'summary', 'shortDescription', 'excerpt', 'details', 'body', 'content', 'text', 'html'])),
  ];

  for (const candidate of candidates) {
    const cleaned = normalizeText(candidate);
    if (cleaned && !isGenericOrganizer(cleaned)) {
      return cleaned.slice(0, 120);
    }
  }

  return null;
}

export function extractQualityHints(rawData: Record<string, unknown>): string {
  return collectStrings(rawData, 0, new Set()).join(' ');
}

function normalizeText(value: string | undefined): string {
  if (!value) {
    return '';
  }

  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeDescription(value: string | undefined): string {
  const cleaned = normalizeText(value);
  if (!cleaned) {
    return '';
  }

  return cleaned
    .replace(new RegExp(`^(?:${DESCRIPTION_PREFIXES.map(escapeRegExp).join('|')})\\b[\\s:•|\\-]*`, 'i'), '')
    .replace(/\b(attendees?|registrations?|participants?)[:\s-]+\d[\d,]*/gi, '')
    .replace(/\b(sales end soon|just added|save this event|share this event)\b/gi, '')
    .replace(/\b(updated|posted|published)\s+(?:at|on)\s+\d{1,2}[:.]\d{2}\s*(?:am|pm)?(?:\s*\w{3,9})?/gi, '')
    .replace(/\b(?:\w{3,9}\s+\d{1,2},\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4})\b/g, '')
    .replace(/\b(?:\d{1,2}:\d{2}\s*(?:am|pm)|\d{1,2}\s*(?:am|pm))\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractText(value: Record<string, unknown> | undefined, keys: string[]): string {
  if (!value) {
    return '';
  }

  const queue: unknown[] = [value];
  const seen = new Set<object>();

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || typeof current !== 'object') {
      continue;
    }

    if (seen.has(current as object)) {
      continue;
    }
    seen.add(current as object);

    for (const [key, nested] of Object.entries(current as Record<string, unknown>)) {
      if (keys.includes(key) && typeof nested === 'string' && nested.trim()) {
        return nested;
      }

      if (nested && typeof nested === 'object') {
        queue.push(nested);
      }
    }
  }

  return '';
}

function collectStrings(value: unknown, depth: number, seen: Set<object>): string[] {
  if (!value || depth > 2) {
    return [];
  }

  if (typeof value === 'string') {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.flatMap((entry) => collectStrings(entry, depth + 1, seen));
  }

  if (typeof value !== 'object') {
    return [];
  }

  if (seen.has(value as object)) {
    return [];
  }
  seen.add(value as object);

  const entries: string[] = [];
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (typeof nested === 'string') {
      if (ORGANIZER_KEYS.includes(key) || /title|name|tag|venue|location|mode|host|organizer|organiser|organization|text|html|body|content|description|summary|excerpt/i.test(key)) {
        entries.push(nested);
      }
      continue;
    }

    entries.push(...collectStrings(nested, depth + 1, seen));
  }

  return entries;
}

function extractOrganizerFromText(value: string): string {
  const text = normalizeText(value);
  if (!text) {
    return '';
  }

  const patterns = [
    /(?:hosted by|organized by|organised by|presented by|powered by|by|from)\s+([^•|:.-]{2,80}?)(?=$|[•|:.-]\s|,|\(|\)|\d{4}\b)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return '';
}

function extractUrlTitle(sourceUrl?: string): string {
  if (!sourceUrl) {
    return '';
  }

  try {
    const parsed = new URL(sourceUrl);
    const lastSegment = parsed.pathname.split('/').filter(Boolean).pop() ?? '';
    const readable = lastSegment.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
    return readable && !isGenericTitle(readable) ? readable : '';
  } catch {
    return '';
  }
}

function isGenericTitle(value: string): boolean {
  const lower = value.toLowerCase().trim();
  if (!lower) {
    return true;
  }

  return GENERIC_TITLE_TERMS.some((term) => lower === term || lower.includes(term)) ||
    /^\d+$/.test(lower) ||
    /^event\s*\d+$/i.test(lower) ||
    /^hackathon\s*\d*$/i.test(lower);
}

function isGenericDescription(value: string): boolean {
  const lower = value.toLowerCase();
  return [
    'learn more',
    'join us',
    'register now',
    'view details',
    'click here',
    'read more',
    'discover',
    'explore',
    'browse',
    'dashboard',
    'profile',
    'organizer',
    'organizers',
    'guides',
    'documentation',
    'docs',
    'blog',
    'news',
    'resources',
  ].some((term) => lower.includes(term)) || /https?:\/\//i.test(lower);
}

function isGenericOrganizer(value: string): boolean {
  const lower = value.toLowerCase().trim();
  return [
    'hackathon',
    'hackathons',
    'event',
    'events',
    'organizer',
    'organizers',
    'host',
    'hosted by',
    'by',
    'learn more',
    'register now',
  ].some((term) => lower === term || lower.includes(`${term} `) || lower.includes(` ${term}`));
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
