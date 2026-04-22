import 'dotenv/config';

import { sql } from 'drizzle-orm';

import { db } from '../db';
import { updateStatuses } from '../pipeline/statusUpdater';
import { scrapeDevpost } from '../scrapers/devpost';
import { scrapeMLH } from '../scrapers/mlh';

type ResultRow = Record<string, unknown>;

interface StatusRow {
  status: string;
  count: number;
}

interface ModeRow {
  mode: string;
  count: number;
}

interface ThemeRow {
  theme: string;
  count: number;
}

interface DeadlineRow {
  title: string;
  registration_deadline: string | Date;
  status: string;
}

interface ScrapeLogRow {
  source: string;
  success: boolean;
  records_found: number;
  records_new: number;
  records_updated: number;
}

// Runs Day 1 end-to-end checks: scrape, status update, and data validation report.
export async function runFullTest(): Promise<void> {
  try {
    console.info('Starting full system test...');

    await scrapeDevpost();
    console.log('[MLH] Running MLH scraper...');
    try {
      await scrapeMLH();
    } catch (error: unknown) {
      console.error('[MLH] Scraper failed:', toErrorMessage(error));
    }
    await updateStatuses();

    const totalCountRows = rowsFromResult(await db.execute(sql`SELECT COUNT(*) AS total FROM hackathons;`));
    const statusRows = rowsFromResult(await db.execute(sql`SELECT status, COUNT(*) AS count FROM hackathons GROUP BY status;`));
    const modeRows = rowsFromResult(await db.execute(sql`SELECT mode, COUNT(*) AS count FROM hackathons GROUP BY mode;`));
    const themeRows = rowsFromResult(await db.execute(sql`
      SELECT unnest(themes) as theme, COUNT(*) AS count
      FROM hackathons
      GROUP BY theme
      ORDER BY count DESC;
    `));
    const deadlineRows = rowsFromResult(await db.execute(sql`
      SELECT title, registration_deadline, status
      FROM hackathons
      WHERE registration_deadline IS NOT NULL
      ORDER BY registration_deadline ASC
      LIMIT 5;
    `));
    const scrapeLogRows = rowsFromResult(await db.execute(sql`
      SELECT source, success, records_found, records_new, records_updated
      FROM scrape_logs
      ORDER BY started_at DESC
      LIMIT 3;
    `));

    const total = toNumber(totalCountRows[0]?.total);
    const statuses = toStatusRows(statusRows);
    const modes = toModeRows(modeRows);
    const themes = toThemeRows(themeRows);
    const deadlines = toDeadlineRows(deadlineRows);
    const logs = toScrapeLogRows(scrapeLogRows);

    printHeader();
    console.info(`\n📊 Total Hackathons: ${total}`);

    console.info('\n📈 Status Distribution:');
    if (statuses.length === 0) {
      console.info('- no data');
    } else {
      for (const row of statuses) {
        console.info(`- ${row.status}: ${row.count}`);
      }
    }

    console.info('\n🌐 Mode Distribution:');
    if (modes.length === 0) {
      console.info('- no data');
    } else {
      for (const row of modes) {
        console.info(`- ${row.mode}: ${row.count}`);
      }
    }

    console.info('\n🏷️ Top Themes:');
    if (themes.length === 0) {
      console.info('- no data');
    } else {
      for (const row of themes) {
        console.info(`- ${row.theme}: ${row.count}`);
      }
    }

    console.info('\n⏳ Upcoming Deadlines:');
    if (deadlines.length === 0) {
      console.info('- no data');
    } else {
      for (const row of deadlines) {
        const dateLabel = new Date(row.registration_deadline).toISOString();
        console.info(`- ${row.title} | ${dateLabel} | ${row.status}`);
      }
    }

    console.info('\n📜 Recent Scrape Logs:');
    if (logs.length === 0) {
      console.info('- no data');
    } else {
      for (const row of logs) {
        console.info(`- ${row.source} | ${row.success} | ${row.records_new} | ${row.records_updated}`);
      }
    }
  } catch (error: unknown) {
    console.error('Full system test failed:', toErrorMessage(error));
    throw error;
  }
}

function printHeader(): void {
  console.info('==============================');
  console.info('🚀 HackRadar System Test Report');
  console.info('==============================');
}

function rowsFromResult(result: unknown): ResultRow[] {
  if (!result || typeof result !== 'object') {
    return [];
  }

  const maybeRows = (result as { rows?: unknown }).rows;
  if (!Array.isArray(maybeRows)) {
    return [];
  }

  return maybeRows.filter(isResultRow);
}

function isResultRow(value: unknown): value is ResultRow {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function toStatusRows(rows: ResultRow[]): StatusRow[] {
  return rows
    .map((row) => ({
      status: toStringValue(row.status),
      count: toNumber(row.count),
    }))
    .filter((row) => row.status.length > 0);
}

function toModeRows(rows: ResultRow[]): ModeRow[] {
  return rows
    .map((row) => ({
      mode: toStringValue(row.mode),
      count: toNumber(row.count),
    }))
    .filter((row) => row.mode.length > 0);
}

function toThemeRows(rows: ResultRow[]): ThemeRow[] {
  return rows
    .map((row) => ({
      theme: toStringValue(row.theme),
      count: toNumber(row.count),
    }))
    .filter((row) => row.theme.length > 0);
}

function toDeadlineRows(rows: ResultRow[]): DeadlineRow[] {
  return rows
    .map((row) => ({
      title: toStringValue(row.title),
      registration_deadline: toDateValue(row.registration_deadline),
      status: toStringValue(row.status),
    }))
    .filter((row) => row.title.length > 0 && row.status.length > 0);
}

function toScrapeLogRows(rows: ResultRow[]): ScrapeLogRow[] {
  return rows
    .map((row) => ({
      source: toStringValue(row.source),
      success: toBoolean(row.success),
      records_found: toNumber(row.records_found),
      records_new: toNumber(row.records_new),
      records_updated: toNumber(row.records_updated),
    }))
    .filter((row) => row.source.length > 0);
}

function toStringValue(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  if (value === null || value === undefined) {
    return '';
  }

  return String(value);
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  return 0;
}

function toDateValue(value: unknown): Date {
  if (value instanceof Date) {
    return value;
  }

  const parsed = new Date(toStringValue(value));
  if (Number.isNaN(parsed.getTime())) {
    return new Date(0);
  }

  return parsed;
}

function toBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }

  return false;
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

void runFullTest()
  .then(() => {
    process.exit(0);
  })
  .catch(() => {
    process.exit(1);
  });