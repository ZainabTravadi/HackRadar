import axios from 'axios';
import { and, eq } from 'drizzle-orm';

import { db } from '../db';
import { hackathons, scrapeLogs, type Hackathon } from '../db/schema';
import { normalize, type RawHackathon } from '../pipeline/normalizer';

const DEVPOST_BASE_URL = 'https://devpost.com';
const REQUEST_TIMEOUT_MS = 15_000;
const REQUEST_DELAY_MS = 3_000;
const MAX_PAGES = 10;
const MAX_API_PAGES = 15;

const REQUEST_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'application/json,text/plain,*/*',
  'Accept-Language': 'en-US,en;q=0.9',
} as const;

type UpsertOutcome = 'new' | 'updated' | 'skipped';

interface DevpostApiHackathon {
  id: number | string;
  title?: string;
  url?: string;
  tagline?: string;
  submission_period_dates?: string;
  prize_amount?: string | number | null;
  registrations_count?: number | string | null;
  location?: string | null;
  themes?: string[] | null;
  organization_name?: string | null;
}

interface DevpostApiMeta {
  total_pages?: number;
}

interface DevpostApiResponse {
  hackathons?: DevpostApiHackathon[];
  meta?: DevpostApiMeta;
}

interface ListingPageResult {
  hackathons: RawHackathon[];
  totalPages: number;
}

// Fetches one Devpost listing page from the JSON API and maps entries into RawHackathon records.
export async function fetchListingPage(page: number): Promise<ListingPageResult> {
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      console.log('[Devpost API] Fetching page:', page);
      const response = await axios.get<DevpostApiResponse>('https://devpost.com/hackathons.json', {
        params: {
          status: 'upcoming',
          page: page,
          per_page: 24,
        },
        headers: {
          'User-Agent': 'Mozilla/5.0',
          Accept: 'application/json',
        },
      });
      console.log('[Devpost API] Status:', response.status);
      console.log('[Devpost API] Items:', (response.data.hackathons ?? []).length);

      const apiHackathons = Array.isArray(response.data?.hackathons) ? response.data.hackathons : [];
      const totalPagesRaw = response.data?.meta?.total_pages;
      const totalPages = clampPages(typeof totalPagesRaw === 'number' && totalPagesRaw > 0 ? totalPagesRaw : 1);

      console.info(`[Devpost] Page ${page} fetched ${apiHackathons.length} hackathons from API`);
      console.info(`[Devpost] API reported total pages: ${totalPages}`);
      console.info(
        `[Devpost] Page ${page} sample titles: ${apiHackathons
          .slice(0, 3)
          .map((item) => item.title ?? '(untitled)')
          .join(' | ')}`
      );

      const mapped = apiHackathons
        .map((item) => mapApiHackathonToRaw(item))
        .filter((item): item is RawHackathon => item !== null);

      return {
        hackathons: mapped,
        totalPages,
      };
    } catch (error: unknown) {
      console.warn(
        `[Devpost] Listing API failed for page ${page} (attempt ${attempt}/${maxAttempts}): ${toErrorMessage(error)}`
      );

      if (attempt < maxAttempts) {
        await delay(1_500 * attempt);
        continue;
      }

      throw error;
    }
  }

  return { hackathons: [], totalPages: 1 };
}

// Upserts a single normalized record and reports whether it was inserted, updated, or skipped.
export async function upsertHackathon(raw: RawHackathon): Promise<UpsertOutcome> {
  const normalized = normalize(raw);

  const existing = await db
    .select()
    .from(hackathons)
    .where(and(eq(hackathons.source, raw.source), eq(hackathons.sourceId, raw.sourceId)))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(hackathons).values(normalized);
    return 'new';
  }

  const current = existing[0];
  const hasImportantChanges =
    current.title !== normalized.title ||
    getTimeOrNull(current.submissionDeadline) !== getTimeOrNull(normalized.submissionDeadline) ||
    (current.participantCount ?? null) !== (normalized.participantCount ?? null);

  if (!hasImportantChanges) {
    return 'skipped';
  }

  const updateValues = buildUpdateValues(normalized);
  await db.update(hackathons).set(updateValues).where(eq(hackathons.id, current.id));
  return 'updated';
}

// Runs the full Devpost scrape job, writes scrape logs, and summarizes outcomes.
export async function scrapeDevpost(): Promise<void> {
  console.info('[Devpost] Starting scrape job...');

  const insertedLog = await db.insert(scrapeLogs).values({ source: 'devpost' }).returning({ id: scrapeLogs.id });
  const scrapeLogId = insertedLog[0]?.id;

  let totalFound = 0;
  let totalNew = 0;
  let totalUpdated = 0;

  try {
    let firstPageResult: ListingPageResult;

    try {
      firstPageResult = await fetchListingPage(1);
    } catch (error: unknown) {
      console.error(`[Devpost] Unable to fetch first page: ${toErrorMessage(error)}`);
      firstPageResult = { hackathons: [], totalPages: 1 };
    }

    const totalPages = clampPages(firstPageResult.totalPages);
    const pagesToProcess = Math.min(totalPages, MAX_PAGES);
    console.info(`[Devpost] Processing ${pagesToProcess} page(s) (API total: ${totalPages})`);

    const pageResults: ListingPageResult[] = [firstPageResult];

    for (let page = 2; page <= pagesToProcess; page += 1) {
      await delay(REQUEST_DELAY_MS);
      console.info(`[Devpost] Fetching listing page ${page}/${pagesToProcess}...`);

      try {
        const pageResult = await fetchListingPage(page);
        pageResults.push(pageResult);
      } catch (error: unknown) {
        console.error(`[Devpost] Skipping page ${page} due to API error: ${toErrorMessage(error)}`);
      }
    }

    for (const pageResult of pageResults) {
      totalFound += pageResult.hackathons.length;

      for (const raw of pageResult.hackathons) {
        await delay(REQUEST_DELAY_MS);

        try {
          const outcome = await upsertHackathon(raw);

          if (outcome === 'new') {
            totalNew += 1;
            console.info(`[Devpost] Inserted new hackathon: ${raw.title}`);
          } else if (outcome === 'updated') {
            totalUpdated += 1;
            console.info(`[Devpost] Updated hackathon: ${raw.title}`);
          } else {
            console.info(`[Devpost] Skipped unchanged hackathon: ${raw.title}`);
          }
        } catch (error: unknown) {
          console.error(`[Devpost] Upsert failed for ${raw.sourceUrl}: ${toErrorMessage(error)}`);
        }
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
      `[Devpost] Scrape complete. found=${totalFound}, new=${totalNew}, updated=${totalUpdated}, skipped=${Math.max(totalFound - totalNew - totalUpdated, 0)}`
    );
  } catch (error: unknown) {
    const message = toErrorMessage(error);
    console.error(`[Devpost] Scrape job failed: ${message}`);

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

function mapApiHackathonToRaw(item: DevpostApiHackathon): RawHackathon | null {
  const title = (item.title ?? '').trim();
  const sourceUrl = toAbsoluteUrl(item.url ?? null);
  const sourceId = String(item.id ?? '').trim();

  if (!title || !sourceUrl || !sourceId) {
    return null;
  }

  const { startDate, submissionDeadline } = parseSubmissionPeriodDates(item.submission_period_dates ?? null);

  const participantCount = toNumberOrNull(item.registrations_count);
  const prizeText = item.prize_amount !== undefined && item.prize_amount !== null ? String(item.prize_amount) : undefined;
  const devpostThemes = Array.isArray(item.themes) ? item.themes.filter((value) => typeof value === 'string') : [];

  return {
    title,
    description: (item.tagline ?? '').trim() || title,
    sourceUrl,
    sourceId,
    source: 'devpost',
    organizerName: (item.organization_name ?? '').trim() || undefined,
    submissionDeadline: submissionDeadline ?? undefined,
    startDate: startDate ?? undefined,
    prizeText,
    locationText: (item.location ?? '').trim() || undefined,
    participantCount: participantCount ?? undefined,
    rawData: {
      id: item.id,
      url: item.url,
      submission_period_dates: item.submission_period_dates ?? null,
      devpostThemes,
      extractedAt: new Date().toISOString(),
      payload: item,
    },
  };
}

function parseSubmissionPeriodDates(value: string | null): {
  startDate: Date | null;
  submissionDeadline: Date | null;
} {
  if (!value) {
    return { startDate: null, submissionDeadline: null };
  }

  const parts = value
    .split(/\s*(?:-|–|—|to)\s*/i)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  if (parts.length === 0) {
    return { startDate: null, submissionDeadline: null };
  }

  const first = parseDate(parts[0]);
  const last = parseDate(parts[parts.length - 1]);

  if (parts.length === 1) {
    return { startDate: null, submissionDeadline: first };
  }

  return {
    startDate: first,
    submissionDeadline: last,
  };
}

function parseDate(value: string): Date | null {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toAbsoluteUrl(url: string | null): string | null {
  if (!url) {
    return null;
  }

  try {
    return new URL(url, DEVPOST_BASE_URL).toString();
  } catch {
    return null;
  }
}

function toNumberOrNull(value: number | string | null | undefined): number | null {
  if (typeof value === 'number') {
    return Number.isNaN(value) ? null : Math.trunc(value);
  }

  if (typeof value === 'string') {
    const parsed = Number(value.replace(/,/g, '').trim());
    return Number.isNaN(parsed) ? null : Math.trunc(parsed);
  }

  return null;
}

function clampPages(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 1;
  }

  return Math.min(Math.trunc(value), MAX_API_PAGES);
}

function buildUpdateValues(normalized: ReturnType<typeof normalize>): Partial<Hackathon> {
  return {
    sourceUrl: normalized.sourceUrl,
    title: normalized.title,
    slug: normalized.slug,
    description: normalized.description ?? null,
    imageUrl: normalized.imageUrl ?? null,
    organizerName: normalized.organizerName ?? null,
    registrationDeadline: normalized.registrationDeadline ?? null,
    submissionDeadline: normalized.submissionDeadline ?? null,
    startDate: normalized.startDate ?? null,
    endDate: normalized.endDate ?? null,
    mode: normalized.mode,
    status: normalized.status,
    eligibility: normalized.eligibility,
    themes: normalized.themes,
    countryCode: normalized.countryCode ?? null,
    location: normalized.location ?? null,
    prizePool: normalized.prizePool ?? null,
    prizeType: normalized.prizeType,
    prizeDescription: normalized.prizeDescription ?? null,
    participantCount: normalized.participantCount ?? null,
    canonicalId: normalized.canonicalId ?? null,
    isDuplicate: normalized.isDuplicate ?? false,
    scrapedAt: normalized.scrapedAt,
    updatedAt: new Date(),
    rawData: normalized.rawData ?? null,
  };
}

function getTimeOrNull(value: Date | null | undefined): number | null {
  if (!value) {
    return null;
  }

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}
