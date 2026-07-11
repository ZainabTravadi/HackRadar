import type { NewHackathon } from '../db/schema';

type Theme = 'ai' | 'web3' | 'climate' | 'health' | 'fintech' | 'social' | 'gaming' | 'open';
type Mode = 'online' | 'in_person' | 'hybrid' | 'unknown';
type PrizeType = 'cash' | 'non_cash' | 'mixed' | 'none' | 'unknown';

// Theme keyword dictionary used for fast classification from arbitrary source text.
export const THEME_KEYWORDS: Record<Theme, string[]> = {
  ai: ['ai', 'artificial intelligence', 'machine learning', 'ml', 'llm', 'genai'],
  web3: ['web3', 'blockchain', 'crypto', 'defi', 'solidity', 'smart contract'],
  climate: ['climate', 'sustainability', 'green', 'environment', 'carbon', 'energy'],
  health: ['health', 'healthcare', 'medical', 'medtech', 'wellness', 'biotech'],
  fintech: ['fintech', 'payments', 'banking', 'finance', 'insurtech', 'trading'],
  social: ['social impact', 'community', 'education', 'ngo', 'inclusion', 'accessibility'],
  gaming: ['game', 'gaming', 'esports', 'unity', 'unreal', 'metagame'],
  open: [],
};

const ONLINE_KEYWORDS = ['online', 'virtual', 'remote', 'worldwide'];
const IN_PERSON_KEYWORDS = ['in person', 'onsite', 'on-site', 'venue', 'location'];

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
  const hasOnline = ONLINE_KEYWORDS.some((keyword) => normalizedText.includes(keyword));
  const hasInPerson = IN_PERSON_KEYWORDS.some((keyword) => normalizedText.includes(keyword));

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
  if (/(no\s+prize|without\s+prizes?|no\s+awards?)/.test(lowerText)) {
    return { prizePool: null, prizeType: 'none' };
  }

  const prizeAmounts = extractDollarAmounts(normalizedText);
  const hasPrizeTerms = /(prize|award)/.test(lowerText);
  const hasNonCashTerms = /(swag|credits?|voucher|internship|certificate|merch|goodies)/.test(lowerText);

  if (prizeAmounts.length > 0) {
    const prizePool = prizeAmounts.reduce((sum, amount) => sum + amount, 0);
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

// Converts source-specific raw data into a consistent database insert payload.
export function normalize(raw: RawHackathon): NewHackathon {
  const trimmedTitle = raw.title.trim();
  const trimmedDescription = raw.description.trim();
  const safeDescription = trimmedDescription.slice(0, 500);
  const locationText = raw.locationText?.trim() ?? '';

  const analysisText = [trimmedTitle, trimmedDescription, locationText].filter(Boolean).join(' ');
  const themes = classifyThemes(analysisText);
  const mode = detectMode(analysisText);
  const { prizePool, prizeType } = parsePrize(raw.prizeText ?? '');

  return {
    source: raw.source,
    sourceId: raw.sourceId.trim(),
    sourceUrl: raw.sourceUrl.trim(),
    title: trimmedTitle,
    slug: generateSlug(trimmedTitle, raw.source, raw.sourceId),
    description: safeDescription || null,
    imageUrl: raw.imageUrl?.trim() || null,
    organizerName: raw.organizerName?.trim() || null,
    registrationDeadline: toDateOrNull(raw.registrationDeadline),
    submissionDeadline: toDateOrNull(raw.submissionDeadline),
    startDate: toDateOrNull(raw.startDate),
    endDate: toDateOrNull(raw.endDate),
    mode,
    themes,
    location: locationText || null,
    prizePool,
    prizeType,
    prizeDescription: raw.prizeText?.trim() || null,
    participantCount: toIntegerOrNull(raw.participantCount),
    canonicalId: null,
    isDuplicate: false,
    scrapedAt: new Date(),
    updatedAt: new Date(),
    rawData: JSON.stringify(raw.rawData),
    countryCode: null,
    eligibility: 'unknown',
    status: 'upcoming',
  } satisfies NewHackathon;
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