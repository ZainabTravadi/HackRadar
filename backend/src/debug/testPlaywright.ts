import { chromium, type Browser } from 'playwright';

const DEVPOST_UPCOMING_URL = 'https://devpost.com/hackathons?status=upcoming';
const SCREENSHOT_PATH = 'debug-devpost.png';
const REALISTIC_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36';

async function runPlaywrightSmokeTest(): Promise<void> {
  let browser: Browser | null = null;

  try {
    browser = await chromium.launch({ headless: true });

    const context = await browser.newContext({
      userAgent: REALISTIC_USER_AGENT,
    });

    const page = await context.newPage();

    await page.goto(DEVPOST_UPCOMING_URL, {
      waitUntil: 'networkidle',
    });

    const pageTitle = await page.title();
    const currentUrl = page.url();

    console.info('Playwright smoke test succeeded.');
    console.info(`Page title: ${pageTitle}`);
    console.info(`Current URL: ${currentUrl}`);

    await page.screenshot({
      path: SCREENSHOT_PATH,
      fullPage: true,
    });

    console.info(`Screenshot saved: ${SCREENSHOT_PATH}`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Playwright smoke test failed:', message);

    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }

    process.exitCode = 1;
  } finally {
    if (browser) {
      await browser.close();
      console.info('Browser closed cleanly.');
    }
  }
}

void runPlaywrightSmokeTest();
