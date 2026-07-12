import type { NewHackathon } from '../db/schema';

type Theme =
  | 'ai'
  | 'web3'
  | 'climate'
  | 'health'
  | 'fintech'
  | 'social'
  | 'gaming'
  | 'security'
  | 'robotics'
  | 'education'
  | 'opensource'
  | 'cloud'
  | 'devtools'
  | 'open';
type Mode = 'online' | 'in_person' | 'hybrid' | 'unknown';
type PrizeType = 'cash' | 'non_cash' | 'mixed' | 'none' | 'unknown';

// Theme keyword dictionary used for fast classification from arbitrary source text.
export const THEME_KEYWORDS: Record<Theme, string[]> = {
  ai: ['ai', 'artificial intelligence', 'machine learning', 'ml', 'llm', 'genai', 'agents'],
  web3: ['web3', 'blockchain', 'crypto', 'defi', 'solidity', 'smart contract', 'nft'],
  climate: ['climate', 'sustainability', 'green', 'environment', 'carbon', 'energy'],
  health: ['health', 'healthcare', 'medical', 'medtech', 'wellness', 'biotech'],
  fintech: ['fintech', 'payments', 'banking', 'finance', 'insurtech', 'trading'],
  social: ['social impact', 'community', 'education', 'ngo', 'inclusion', 'accessibility'],
  gaming: ['game', 'gaming', 'esports', 'unity', 'unreal', 'metagame'],
  security: ['security', 'cyber', 'cybersecurity', 'infosec', 'vulnerability', 'ctf'],
  robotics: ['robot', 'robotics', 'automation', 'mechatronic'],
  education: ['education', 'edtech', 'learning', 'teaching', 'student'],
  opensource: ['open source', 'opensource', 'git', 'github', 'contribute', 'community'],
  cloud: ['cloud', 'aws', 'azure', 'gcp', 'serverless', 'kubernetes'],
  devtools: ['devtools', 'developer tools', 'sdk', 'cli', 'api', 'tooling'],
  open: [],
};

const ONLINE_KEYWORDS = [
  'online',
  'virtual',
  'remote',
  'worldwide',
  'discord',
  'zoom',
  'meet',
  'webinar',
  'virtual event',
  'remote event',
  'streaming',
  'livestream',
  'live stream',
  'google meet',
  'microsoft teams',
  'teams',
  'slack',
  'twitch',
  'youtube live',
  'hopin',
  'gather.town',
  'gather town',
  'airmeet',
  'vfairs',
  'expo platform',
  'virtual platform',
  'online platform',
  'digital event',
  'hybrid event',
  'global',
  'anywhere',
];

const IN_PERSON_KEYWORDS = [
  'in person',
  'onsite',
  'on-site',
  'venue',
  'location',
  'city',
  'street',
  'campus',
  'auditorium',
  'hall',
  'centre',
  'center',
  'physical',
  'address',
  'building',
  'room',
  'floor',
  'convention center',
  'conference center',
  'hotel',
  'university',
  'college',
  'campus',
  'arena',
  'stadium',
  'expo center',
  'exhibition center',
  'tech hub',
  'innovation center',
  'coworking',
  'incubator',
  'accelerator',
  'maker space',
  'hackerspace',
  'lab',
  'laboratory',
];

const HYBRID_KEYWORDS = [
  'hybrid',
  'both online and in-person',
  'online and onsite',
  'virtual and physical',
  'attend online or in person',
  'join remotely or onsite',
  'flexible attendance',
  'online and in-person',
  'virtual and in-person',
  'remote and onsite',
];

const TITLE_PREFIX_PATTERNS = [
  /^(?:view|save this event|share this event|sales end soon|just added|tomorrow at|today at|this weekend|this week|next week|next weekend|starting soon)\b/i,
  /^(?:tomorrow|today|this weekend|this week|next week|next weekend)\s+at\b[^|•\-:]*?(?:[|•\-:]\s*)?/i,
];

const GENERIC_DESCRIPTION_TERMS = [
  'learn more',
  'join us',
  'register now',
  'view details',
  'click here',
  'read more',
  'discover',
  'explore',
  'browse',
  'host a hackathon',
  'your hackathons',
  'host a hackathons',
  'my hackathons',
  'dashboard',
  'profile',
  'organizer',
  'organizers',
  'guides',
  'guide',
  'documentation',
  'docs',
  'blog',
  'news',
  'resources',
];

// Raw scraper contract consumed by the normalization pipeline.
export interface RawHackathon {
  title: string;
  description: string;
  sourceUrl: string;
  sourceId: string;
  source:
    | 'devpost'
    | 'mlh'
    | 'devfolio'
    | 'unstop'
    | 'dorahacks'
    | 'taikai'
    | 'hackerearth'
    | 'hack2skill'
    | 'reskilll'
    | 'lablab'
    | 'ethglobal'
    | 'angelhack'
    | 'hackclub'
    | 'university'
    | 'eventbrite'
    | 'luma'
    | 'meetup'
    | 'github'
    | 'reddit'
    | 'discord'
    | 'telegram'
    | 'linkedin'
    | 'twitter'
    | 'facebook'
    | 'google';
  imageUrl?: string;
  organizerName?: string;
  registrationDeadline?: Date;
  submissionDeadline?: Date;
  startDate?: Date;
  endDate?: Date;
  prizeText?: string;
  locationText?: string;
  participantCount?: number;
  mode?: 'online' | 'in_person' | 'hybrid' | 'unknown';
  applicationUrl?: string;
  rawData: Record<string, unknown>;
}

// Returns all matching themes from text; falls back to 'open' when no match is found.
export function classifyThemes(text: string): string[] {
  const normalizedText = text.toLowerCase();
  const matchedThemes: Theme[] = [];

  for (const [theme, keywords] of Object.entries(THEME_KEYWORDS) as [Theme, string[]][]) {
    if (theme === 'open') {
      continue;
    }

    const hasMatch = keywords.some((keyword) => normalizedText.includes(keyword));
    if (hasMatch) {
      matchedThemes.push(theme);
    }
  }

  return matchedThemes.length > 0 ? matchedThemes : ['open'];
}

// Detects participation mode from location/description language.
export function detectMode(text: string): Mode {
  const normalizedText = text.toLowerCase();

  const hasHybrid = HYBRID_KEYWORDS.some((keyword) => normalizedText.includes(keyword)) ||
    /(online|virtual|remote).*(in[- ]person|onsite|venue|location|campus|city|address|room|hall|hotel|office|studio)/i.test(normalizedText) ||
    /(in[- ]person|onsite|venue|location|campus|city|address|room|hall|hotel|office|studio).*(online|virtual|remote)/i.test(normalizedText);
  if (hasHybrid) {
    return 'hybrid';
  }

  const hasOnline = ONLINE_KEYWORDS.some((keyword) => normalizedText.includes(keyword)) ||
    /(remote|virtual|online|zoom|discord|teams|livestream|stream|youtube live|twitch|airmeet|hopin|gather)/i.test(normalizedText);
  const hasInPerson = IN_PERSON_KEYWORDS.some((keyword) => normalizedText.includes(keyword)) ||
    /(venue|address|location|city|campus|room|hall|building|hotel|office|studio|lab|center|centre|university|college|arena|stadium|museum|coworking)/i.test(normalizedText);

  if (hasOnline && hasInPerson) {
    return 'hybrid';
  }

  if (hasOnline) {
    return 'online';
  }

  if (hasInPerson) {
    return 'in_person';
  }

  return 'unknown';
}

// Parses prize metadata and attempts to extract USD amounts.
export function parsePrize(text: string): { prizePool: number | null; prizeType: PrizeType } {
  const normalizedText = text.trim();
  if (!normalizedText) {
    return { prizePool: null, prizeType: 'unknown' };
  }

  const lowerText = normalizedText.toLowerCase();
  if (/^\$?\s*0(?:\.0+)?$/.test(normalizedText) || /(no\s+prize|without\s+prizes?|no\s+awards?)/.test(lowerText)) {
    return { prizePool: null, prizeType: 'none' };
  }

  const prizeAmounts = extractDollarAmounts(normalizedText);
  const hasPrizeTerms = /(prize|award)/.test(lowerText);
  const hasNonCashTerms = /(swag|credits?|voucher|internship|certificate|merch|goodies)/.test(lowerText);

  if (prizeAmounts.length > 0) {
    const prizePool = prizeAmounts.reduce((sum, amount) => sum + amount, 0);
    if (prizePool <= 0) {
      return { prizePool: null, prizeType: 'none' };
    }
    const prizeType: PrizeType = hasNonCashTerms ? 'mixed' : 'cash';
    return { prizePool, prizeType };
  }

  if (hasPrizeTerms) {
    return { prizePool: null, prizeType: 'non_cash' };
  }

  return { prizePool: null, prizeType: 'unknown' };
}

// Builds a deterministic slug for deduplication and SEO-friendly routing.
export function generateSlug(title: string, source: string, sourceId: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');

  const sanitizedSource = source.toLowerCase().replace(/[^a-z0-9]/g, '');
  const sourceSuffix = sourceId.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toLowerCase() || 'unknown';

  const safeBase = base || 'hackathon';
  return `${safeBase}-${sanitizedSource}-${sourceSuffix}`;
}

function stripHtml(value: string): string {
  if (!value) return '';
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanTitleText(value: string): string {
  const cleaned = stripHtml(value).trim();
  if (!cleaned) {
    return '';
  }

  const normalized = cleaned.replace(/\s+/g, ' ').trim();
  const segments = normalized
    .split(/(?:\s*[|•:-]\s*|\s{2,})/)
    .map((segment) => segment.trim())
    .filter(Boolean);

  const lastMeaningfulSegment = segments.length > 1
    ? segments[segments.length - 1]
    : normalized;

  let title = lastMeaningfulSegment.replace(/\s+/g, ' ').trim();
  for (const pattern of TITLE_PREFIX_PATTERNS) {
    title = title.replace(pattern, '').trim();
  }

  title = title.replace(/^(?:view|save this event|share this event|sales end soon|just added|tomorrow at|today at|this weekend|this week|next week|next weekend|starting soon)\b[\s:•|-]*/i, '').trim();
  title = title.replace(/^(?:at|on|for)\b/i, '').trim();
  title = title.replace(/^[\s•|:\-]+/, '').trim();
  title = title.replace(/[|•\-]+$/, '').trim();
  return title.replace(/\s+/g, ' ').trim();
}

function cleanDescriptionText(value: string): string {
  const cleaned = stripHtml(value).trim();
  if (!cleaned) {
    return '';
  }

  return cleaned
    .replace(/\s+/g, ' ')
    .replace(/^(?:view|save this event|share this event|sales end soon|just added|tomorrow at|today at)\b/i, '')
    .replace(/\s+/g, ' ')
    .replace(/^[\s•|:\-]+/, '')
    .replace(/[\s•|:\-]+$/, '')
    .trim();
}

function looksLikeGenericDescription(text: string): boolean {
  const lowerText = text.toLowerCase();
  if (!lowerText) {
    return true;
  }

  return GENERIC_DESCRIPTION_TERMS.some((term) => lowerText.includes(term)) ||
    /https?:\/\//i.test(lowerText) ||
    /[\u{1F300}-\u{1FAFF}]/u.test(lowerText);
}

function formatModeLabel(mode: Mode): string {
  switch (mode) {
    case 'online':
      return 'Online';
    case 'in_person':
      return 'In-person';
    case 'hybrid':
      return 'Hybrid';
    default:
      return 'Unknown';
  }
}

function formatParticipantCount(value: number): string {
  return `${value.toLocaleString('en-US')} participant${value === 1 ? '' : 's'}`;
}

function buildMeaningfulDescription(
  title: string,
  description: string,
  location: string,
  organizer: string,
  participantCount: number | undefined,
  mode: Mode,
): string {
  const normalizedTitle = cleanTitleText(title);
  const normalizedDescription = cleanDescriptionText(description);

  let summary = normalizedDescription && !looksLikeGenericDescription(normalizedDescription)
    ? normalizedDescription
    : normalizedTitle || 'Hackathon opportunity';

  if (location && !summary.includes(location)) {
    summary = `${summary} • ${location}`;
  }

  if (participantCount && participantCount > 0 && !summary.includes(formatParticipantCount(participantCount))) {
    summary = `${summary} • ${formatParticipantCount(participantCount)}`;
  }

  if (mode !== 'unknown' && !summary.includes(formatModeLabel(mode))) {
    summary = `${summary} • ${formatModeLabel(mode)}`;
  }

  if (organizer && !summary.includes(organizer)) {
    summary = `${summary} • Hosted by ${organizer}`;
  }

  return summary.slice(0, 500);
}

// Converts source-specific raw data into a consistent database insert payload.
export function normalize(raw: RawHackathon): NewHackathon {
  // Strip HTML tags and decode entities from all text fields
  const cleanTitle = cleanTitleText(raw.title);
  const cleanDescription = cleanDescriptionText(raw.description);
  const cleanPrizeText = raw.prizeText ? stripHtml(raw.prizeText).trim() : '';
  const cleanLocationText = raw.locationText ? stripHtml(raw.locationText).trim() : '';
  const cleanOrganizerName = raw.organizerName ? stripHtml(raw.organizerName).trim() : '';

  // Conservative list of core sources expected to exist in older DB enums.
  const CORE_SOURCES = [
    'devpost',
    'mlh',
    'devfolio',
    'unstop',
    'dorahacks',
    'taikai',
    'hackerearth',
    'hack2skill',
    'reskilll',
    'lablab',
    'ethglobal',
    'angelhack',
    'hackclub',
    'university',
    'eventbrite',
    'luma',
    'meetup',
    'manual',
  ];

  // Map less-critical/social sources to 'manual' to avoid DB enum insertion errors
  const safeSource = CORE_SOURCES.includes(raw.source) ? raw.source : 'manual';

  const analysisText = [cleanTitle, cleanDescription, cleanLocationText, raw.sourceUrl ?? '', cleanOrganizerName]
    .filter(Boolean)
    .join(' ');
  const themes = classifyThemes(analysisText);
  const mode = detectMode(analysisText);
  const status = calculateStatus(raw);
  const { prizePool, prizeType } = parsePrize(cleanPrizeText);
  const safeDescription = buildMeaningfulDescription(
    cleanTitle,
    cleanDescription,
    cleanLocationText,
    cleanOrganizerName,
    raw.participantCount,
    mode,
  );

  return {
    source: safeSource,
    sourceId: raw.sourceId.trim(),
    sourceUrl: raw.sourceUrl.trim(),
    title: cleanTitle,
    slug: generateSlug(cleanTitle, safeSource, raw.sourceId),
    description: safeDescription || null,
    imageUrl: raw.imageUrl?.trim() || null,
    organizerName: cleanOrganizerName || null,
    registrationDeadline: toDateOrNull(raw.registrationDeadline),
    submissionDeadline: toDateOrNull(raw.submissionDeadline),
    startDate: toDateOrNull(raw.startDate),
    endDate: toDateOrNull(raw.endDate),
    mode,
    themes,
    location: cleanLocationText || null,
    prizePool,
    prizeType,
    prizeDescription: cleanPrizeText && prizeType !== 'none' ? cleanPrizeText : null,
    participantCount: toIntegerOrNull(raw.participantCount),
    canonicalId: null,
    isDuplicate: false,
    scrapedAt: new Date(),
    updatedAt: new Date(),
    rawData: JSON.stringify(raw.rawData),
    countryCode: null,
    eligibility: 'unknown',
    status,
  } satisfies NewHackathon;
}

function calculateStatus(raw: RawHackathon): NewHackathon['status'] {
  const now = new Date();
  const registrationDeadline = raw.registrationDeadline;
  const submissionDeadline = raw.submissionDeadline;
  const startDate = raw.startDate;
  const endDate = raw.endDate;

  if (registrationDeadline && registrationDeadline < now) {
    if (submissionDeadline && submissionDeadline < now) {
      return 'ended';
    }
    if (startDate && startDate <= now && (!endDate || endDate >= now)) {
      return 'open';
    }
    return 'closing_soon';
  }

  if (startDate && startDate <= now && (!endDate || endDate >= now)) {
    return 'open';
  }

  if (endDate && endDate < now) {
    return 'ended';
  }

  return 'upcoming';
}

function extractDollarAmounts(text: string): number[] {
  const amounts: number[] = [];
  const regex = /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)(\s*[kK])?/g;

  for (const match of text.matchAll(regex)) {
    const numericPart = match[1].replace(/,/g, '');
    const parsed = Number(numericPart);
    if (Number.isNaN(parsed)) {
      continue;
    }

    const hasK = Boolean(match[2]);
    amounts.push(hasK ? parsed * 1000 : parsed);
  }

  return amounts;
}

function toDateOrNull(value: Date | undefined): Date | null {
  if (!value) {
    return null;
  }

  return new Date(value);
}

function toIntegerOrNull(value: number | undefined): number | null {
  if (value === undefined || Number.isNaN(value)) {
    return null;
  }

  return Math.trunc(value);
}