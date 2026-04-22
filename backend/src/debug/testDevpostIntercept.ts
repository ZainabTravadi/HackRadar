import { chromium, type Browser, type Page } from 'playwright';

const DEVPOST_UPCOMING_URL = 'https://devpost.com/hackathons?status=upcoming';
const FAILED_SCREENSHOT_PATH = 'debug-intercept-failed.png';
const REALISTIC_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36';
const VIEWPORT = { width: 1920, height: 1080 };
const INTERCEPT_TIMEOUT_MS = 15000;

interface DevpostHackathon {
  title: string;
}

interface DevpostMeta {
  total_count: number;
}

interface DevpostHackathonsResponse {
  hackathons: DevpostHackathon[];
  meta: DevpostMeta;
}

interface PotentialHackathonApiMatch {
  url: string;
  itemCount: number;
  firstTitle: string;
}

function isDevpostHackathonsResponse(value: unknown): value is DevpostHackathonsResponse {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const record = value as Record<string, unknown>;
  const hackathons = record.hackathons;
  const meta = record.meta;

  if (!Array.isArray(hackathons)) {
    return false;
  }

  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) {
    return false;
  }

  const metaRecord = meta as Record<string, unknown>;
  if (typeof metaRecord.total_count !== 'number') {
    return false;
  }

  return hackathons.every((hackathon) => {
    if (!hackathon || typeof hackathon !== 'object' || Array.isArray(hackathon)) {
      return false;
    }

    const item = hackathon as Record<string, unknown>;
    return typeof item.title === 'string';
  });
}

function isCandidateDevpostJsonResponse(url: string, contentType: string): boolean {
  const normalizedContentType = contentType.toLowerCase();
  const isJsonContentType =
    normalizedContentType.includes('application/json') || normalizedContentType.includes('text/json');

  return url.includes('devpost.com') && isJsonContentType;
}

function toRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function getHackathonArrayCandidate(data: unknown): Record<string, unknown>[] | null {
  if (Array.isArray(data)) {
    const rows = data.filter((item): item is Record<string, unknown> => Boolean(toRecord(item)));
    const isHackathonLike = rows.length > 0 && rows.every((item) => typeof item.title === 'string' && typeof item.url === 'string');

    return isHackathonLike ? rows : null;
  }

  const record = toRecord(data);
  if (!record) {
    return null;
  }

  const hackathons = record.hackathons;
  if (Array.isArray(hackathons)) {
    return hackathons.filter((item): item is Record<string, unknown> => Boolean(toRecord(item)));
  }

  const results = record.results;
  if (Array.isArray(results)) {
    return results.filter((item): item is Record<string, unknown> => Boolean(toRecord(item)));
  }

  return null;
}

function detectPotentialHackathonApiPayload(data: unknown, url: string): PotentialHackathonApiMatch | null {
  const items = getHackathonArrayCandidate(data);
  if (!items || items.length === 0) {
    return null;
  }

  const firstTitle = typeof items[0]?.title === 'string' ? items[0].title : 'N/A';
  return {
    url,
    itemCount: items.length,
    firstTitle,
  };
}

async function captureDevpostHackathons(page: Page): Promise<PotentialHackathonApiMatch | null> {
  return new Promise<PotentialHackathonApiMatch | null>((resolve) => {
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) {
        return;
      }

      settled = true;
      page.off('response', onResponse);
      resolve(null);
    }, INTERCEPT_TIMEOUT_MS);

    const onResponse = async (response: {
      url: () => string;
      status: () => number;
      headers: () => Record<string, string>;
      json: () => Promise<unknown>;
    }): Promise<void> => {
      if (settled) {
        return;
      }

      const responseUrl = response.url();
      const contentType = response.headers()['content-type'] ?? '';

      if (!isCandidateDevpostJsonResponse(responseUrl, contentType)) {
        return;
      }

      console.log('[CANDIDATE API]', {
        url: responseUrl,
        status: response.status(),
        contentType,
      });

      try {
        const data = await response.json();
        const potentialMatch = detectPotentialHackathonApiPayload(data, responseUrl);
        if (!potentialMatch) {
          return;
        }

        console.info('POTENTIAL HACKATHON API FOUND');
        console.info(`number of items in this page: ${potentialMatch.itemCount}`);
        console.info(`first item title: ${potentialMatch.firstTitle}`);

        settled = true;
        clearTimeout(timer);
        page.off('response', onResponse);
        resolve(potentialMatch);
      } catch {
        // Ignore non-JSON or unreadable responses and continue listening.
      }
    };

    page.on('response', onResponse);
  });
}

async function runDevpostInterceptTest(): Promise<void> {
  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    browser = await chromium.launch({ headless: true });

    const context = await browser.newContext({
      userAgent: REALISTIC_USER_AGENT,
      viewport: VIEWPORT,
    });

    page = await context.newPage();
    const interceptPromise = captureDevpostHackathons(page);

    await page.goto(DEVPOST_UPCOMING_URL, {
      waitUntil: 'domcontentloaded',
    });

    const intercepted = await interceptPromise;

    if (!intercepted) {
      await page.screenshot({
        path: FAILED_SCREENSHOT_PATH,
        fullPage: true,
      });

      throw new Error(
        `No Devpost hackathons JSON response was captured. Saved screenshot: ${FAILED_SCREENSHOT_PATH}`,
      );
    }

    console.info('API intercepted successfully');
    console.info(`first hackathon title: ${intercepted.firstTitle}`);
    console.info(`number of items in this page: ${intercepted.itemCount}`);
    console.info(`candidate API URL: ${intercepted.url}`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Devpost interception test failed:', message);

    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }

    process.exitCode = 1;
  } finally {
    if (page) {
      await page.close();
    }

    if (browser) {
      await browser.close();
      console.info('Browser closed cleanly.');
    }
  }
}

void runDevpostInterceptTest();
