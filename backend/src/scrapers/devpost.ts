import { and, eq } from 'drizzle-orm';
import {
  chromium,
  type Browser,
  type BrowserContext,
  type Page,
  type Response as PlaywrightResponse,
} from 'playwright';

import { db } from '../db';
import { hackathons, scrapeLogs, type Hackathon } from '../db/schema';
import { normalize, type RawHackathon } from '../pipeline/normalizer';

const DEVPOST_BASE_URL = 'https://devpost.com';
const DEVPOST_LISTING_URL = 'https://devpost.com/hackathons';
const REQUEST_TIMEOUT_MS = 25_000;
const REQUEST_DELAY_MS = 1_000;
const MAX_PAGES = 10;
const MAX_PAGE_RETRIES = 3;
const API_PER_PAGE = 24;
const DEVPOST_STATUSES = ['upcoming', 'open'] as const;

const REQUEST_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'application/json,text/plain,*/*',
  'Accept-Language': 'en-US,en;q=0.9',
} as const;

type UpsertOutcome = 'new' | 'updated' | 'skipped';
type DevpostListingStatus = (typeof DEVPOST_STATUSES)[number];

interface DevpostApiHackathon {
  id: number | string;
  title?: string;
  url?: string;
  tagline?: string;
  submission_period_dates?: string;
  prize_amount?: string | number | null;
  registrations_count?: number | string | null;
  location?: string | null;
  themes?: unknown[] | null;
  organization_name?: string | null;
}

interface DevpostApiMeta {
  total_pages?: number;
  total_count?: number;
}

interface DevpostApiResponse {
  hackathons?: DevpostApiHackathon[];
  meta?: DevpostApiMeta;
}

interface ListingPageResult {
  hackathons: RawHackathon[];
  totalPages: number;
  totalCount: number | null;
}

interface StatusSummary {
  status: DevpostListingStatus;
  pagesProcessed: number;
  pagesPlanned: number;
  found: number;
  inserted: number;
  updated: number;
}

interface InterceptedPagePayload {
  responseUrl: string;
  status: number;
  payload: DevpostApiResponse;
}

interface CandidateIntercept {
  responseUrl: string;
  status: number;
  payload: DevpostApiResponse;
  itemCount: number;
}

// Fetches one Devpost listing page by intercepting JSON responses in Playwright.
export async function fetchListingPage(
  browserPage: Page,
  pageNumber: number,
  listingStatus: DevpostListingStatus,
): Promise<ListingPageResult> {
  const targetUrl = new URL(DEVPOST_LISTING_URL);
  targetUrl.searchParams.set('status', listingStatus);
  targetUrl.searchParams.set('page', String(pageNumber));
  targetUrl.searchParams.set('per_page', String(API_PER_PAGE));

  for (let attempt = 1; attempt <= MAX_PAGE_RETRIES; attempt += 1) {
    try {
      const intercepted = await navigateAndIntercept(browserPage, targetUrl.toString(), listingStatus, pageNumber);

      const apiHackathons = Array.isArray(intercepted.payload.hackathons) ? intercepted.payload.hackathons : [];
      const totalPagesRaw = intercepted.payload.meta?.total_pages;
      const totalPages = clampPages(typeof totalPagesRaw === 'number' && totalPagesRaw > 0 ? totalPagesRaw : 1);
      const totalCountRaw = intercepted.payload.meta?.total_count;
      const totalCount = typeof totalCountRaw === 'number' && totalCountRaw >= 0 ? Math.trunc(totalCountRaw) : null;

      console.info(
        `[Devpost] Page ${pageNumber} fetched. listingStatus=${listingStatus}, status=${intercepted.status}, items=${apiHackathons.length}, totalPages=${totalPages}, totalCount=${totalCount ?? 'unknown'}, api=${intercepted.responseUrl}`
      );

      const mapped = apiHackathons
        .map((item) => mapApiHackathonToRaw(item))
        .filter((item): item is RawHackathon => item !== null);

      console.log(`[Devpost] ${listingStatus} page ${pageNumber}: ${mapped.length}`);

      return {
        hackathons: mapped,
        totalPages,
        totalCount,
      };
    } catch (error: unknown) {
      console.warn(
        `[Devpost] Intercept failed for status=${listingStatus}, page=${pageNumber} (attempt ${attempt}/${MAX_PAGE_RETRIES}): ${toErrorMessage(error)}`
      );

      if (attempt < MAX_PAGE_RETRIES) {
        await delay(1_500 * attempt);
        continue;
      }

      throw error;
    }
  }

  return { hackathons: [], totalPages: 1, totalCount: null };
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
  const statusSummaries: StatusSummary[] = [];
  let browser: Browser | null = null;
  let context: BrowserContext | null = null;
  let page: Page | null = null;

  try {
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({
      userAgent: REQUEST_HEADERS['User-Agent'],
      viewport: { width: 1920, height: 1080 },
      extraHTTPHeaders: {
        Accept: REQUEST_HEADERS.Accept,
        'Accept-Language': REQUEST_HEADERS['Accept-Language'],
      },
    });
    page = await context.newPage();

    for (const listingStatus of DEVPOST_STATUSES) {
      console.info(`[Devpost] Starting status pass: ${listingStatus}`);

      let firstPageResult: ListingPageResult;
      try {
        firstPageResult = await fetchListingPage(page, 1, listingStatus);
      } catch (error: unknown) {
        console.error(`[Devpost] Unable to fetch first page for status=${listingStatus}: ${toErrorMessage(error)}`);
        firstPageResult = { hackathons: [], totalPages: 1, totalCount: null };
      }

      const totalPages = clampPages(firstPageResult.totalPages);
      const fallbackPagesFromCount = pagesFromTotalCount(firstPageResult.totalCount, API_PER_PAGE);
      const pagesToProcess = Math.min(totalPages > 1 ? totalPages : fallbackPagesFromCount, MAX_PAGES);
      console.info(
        `[Devpost] Status=${listingStatus} processing ${pagesToProcess} page(s) (API total pages: ${totalPages}, total count: ${firstPageResult.totalCount ?? 'unknown'}, fallback pages: ${fallbackPagesFromCount})`
      );

      const pageResults: ListingPageResult[] = [firstPageResult];
      console.info(`[Devpost] Status=${listingStatus} items in page 1: ${firstPageResult.hackathons.length}`);

      for (let pageNumber = 2; pageNumber <= pagesToProcess; pageNumber += 1) {
        await delay(REQUEST_DELAY_MS);
        console.info(`[Devpost] Status=${listingStatus} fetching page ${pageNumber}/${pagesToProcess}...`);

        try {
          const pageResult = await fetchListingPage(page, pageNumber, listingStatus);
          console.info(`[Devpost] Status=${listingStatus} items in page ${pageNumber}: ${pageResult.hackathons.length}`);
          pageResults.push(pageResult);
        } catch (error: unknown) {
          console.error(
            `[Devpost] Status=${listingStatus} skipping page ${pageNumber} due to API error: ${toErrorMessage(error)}`
          );
        }
      }

      let pagesProcessed = 0;
      let statusFound = 0;
      let statusNew = 0;
      let statusUpdated = 0;

      for (const pageResult of pageResults) {
        pagesProcessed += 1;
        totalFound += pageResult.hackathons.length;
        statusFound += pageResult.hackathons.length;

        for (const raw of pageResult.hackathons) {
          try {
            const outcome = await upsertHackathon(raw);

            if (outcome === 'new') {
              totalNew += 1;
              statusNew += 1;
              console.info(`[Devpost] Status=${listingStatus} inserted new hackathon: ${raw.title}`);
            } else if (outcome === 'updated') {
              totalUpdated += 1;
              statusUpdated += 1;
              console.info(`[Devpost] Status=${listingStatus} updated hackathon: ${raw.title}`);
            } else {
              console.info(`[Devpost] Status=${listingStatus} skipped unchanged hackathon: ${raw.title}`);
            }
          } catch (error: unknown) {
            console.error(
              `[Devpost] Status=${listingStatus} upsert failed for ${raw.sourceUrl}: ${toErrorMessage(error)}`
            );
          }
        }
      }

      statusSummaries.push({
        status: listingStatus,
        pagesProcessed,
        pagesPlanned: pagesToProcess,
        found: statusFound,
        inserted: statusNew,
        updated: statusUpdated,
      });
      console.info(
        `[Devpost] Status=${listingStatus} summary: pages=${pagesProcessed}/${pagesToProcess}, found=${statusFound}, new=${statusNew}, updated=${statusUpdated}, skipped=${Math.max(statusFound - statusNew - statusUpdated, 0)}`
      );
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
    for (const summary of statusSummaries) {
      console.info(
        `[Devpost] Status report ${summary.status}: pages=${summary.pagesProcessed}/${summary.pagesPlanned}, found=${summary.found}, new=${summary.inserted}, updated=${summary.updated}`
      );
    }
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
  } finally {
    if (page) {
      await page.close();
    }

    if (context) {
      await context.close();
    }

    if (browser) {
      await browser.close();
    }
  }
}

async function navigateAndIntercept(
  page: Page,
  targetUrl: string,
  expectedStatus: DevpostListingStatus,
  expectedPage: number,
): Promise<InterceptedPagePayload> {
  const candidates: CandidateIntercept[] = [];

  const onResponse = async (response: PlaywrightResponse): Promise<void> => {
    if (!isExpectedDevpostApiResponse(response, expectedStatus, expectedPage)) {
      return;
    }

    console.log('[DEBUG] API URL:', response.url());

    try {
      const data = (await response.json()) as unknown;
      const itemCount = getHackathonItemsLength(data);
      console.log('[DEBUG] items length:', itemCount);

      if (!isHackathonsPayload(data)) {
        return;
      }

      candidates.push({
        responseUrl: response.url(),
        status: response.status(),
        payload: data,
        itemCount,
      });

      console.log(
        `[Devpost] Candidate response captured for status=${expectedStatus}, page=${expectedPage}, items=${itemCount}`,
      );
    } catch (error: unknown) {
      console.warn(
        `[Devpost] Failed to parse candidate response for status=${expectedStatus}, page=${expectedPage}: ${toErrorMessage(error)}`,
      );
    }
  };

  page.on('response', onResponse);

  try {
    await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: REQUEST_TIMEOUT_MS });
    await delay(800);
  } finally {
    page.off('response', onResponse);
  }

  if (candidates.length === 0) {
    throw new Error(`Timed out waiting for Devpost hackathon JSON response for ${targetUrl}`);
  }

  const bestCandidate = candidates.reduce((best, current) => (current.itemCount > best.itemCount ? current : best));
  console.log(
    `[Devpost] Selected best candidate for status=${expectedStatus}, page=${expectedPage}: items=${bestCandidate.itemCount}, url=${bestCandidate.responseUrl}`,
  );

  return {
    responseUrl: bestCandidate.responseUrl,
    status: bestCandidate.status,
    payload: bestCandidate.payload,
  };
}

function isExpectedDevpostApiResponse(
  response: PlaywrightResponse,
  expectedStatus: DevpostListingStatus,
  expectedPage: number,
): boolean {
  const url = response.url();
  if (!url.includes('devpost.com') || !url.includes('/api/hackathons')) {
    return false;
  }

  const contentTypeHeader = response.headers()['content-type'] ?? '';
  const contentType = contentTypeHeader.toLowerCase();
  const isJson = contentType.includes('application/json') || contentType.includes('text/json');
  if (!isJson) {
    return false;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return false;
  }

  const statusParam = parsedUrl.searchParams.get('status');
  const pageParam = parsedUrl.searchParams.get('page');
  const pageValue = pageParam ? Number(pageParam) : NaN;

  if (statusParam && statusParam !== expectedStatus) {
    return false;
  }

  if (pageParam) {
    return Number.isFinite(pageValue) && Math.trunc(pageValue) === expectedPage;
  }

  return true;
}

function isHackathonsPayload(value: unknown): value is DevpostApiResponse {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const record = value as Record<string, unknown>;
  return Array.isArray(record.hackathons);
}

function getHackathonItemsLength(value: unknown): number {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return 0;
  }

  const record = value as Record<string, unknown>;
  const hackathons = record.hackathons;
  return Array.isArray(hackathons) ? hackathons.length : 0;
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
  const prizeText = item.prize_amount !== undefined && item.prize_amount !== null ? String(item.prize_amount).trim() : undefined;
  const devpostThemes = normalizeThemes(item.themes ?? null);

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
    .split(/\s+(?:-|–|—|to)\s+/i)
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

function normalizeThemes(value: unknown[] | null): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const themes: string[] = [];

  for (const entry of value) {
    if (typeof entry === 'string') {
      const normalized = entry.trim();
      if (normalized.length > 0) {
        themes.push(normalized);
      }
      continue;
    }

    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      continue;
    }

    const record = entry as Record<string, unknown>;
    const labelCandidate = record.name ?? record.title ?? record.slug;
    if (typeof labelCandidate !== 'string') {
      continue;
    }

    const normalized = labelCandidate.trim();
    if (normalized.length > 0) {
      themes.push(normalized);
    }
  }

  return themes;
}

function clampPages(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 1;
  }

  return Math.min(Math.trunc(value), MAX_PAGES);
}

function pagesFromTotalCount(totalCount: number | null, perPage: number): number {
  if (totalCount === null || !Number.isFinite(totalCount) || totalCount <= 0 || perPage <= 0) {
    return 1;
  }

  return Math.max(1, Math.ceil(totalCount / perPage));
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
