import { sql } from 'drizzle-orm';

import { db } from '../db';

type ResultRow = Record<string, unknown>;

// Runs structured data-quality checks against scraped and normalized records.
export async function validateData(): Promise<void> {
  console.info('\n[Validation] Starting data quality checks...');

  const totalCountResult = await db.execute(sql`SELECT COUNT(*) AS total FROM hackathons;`);
  const statusDistributionResult = await db.execute(sql`
    SELECT status, COUNT(*) AS count
    FROM hackathons
    GROUP BY status
    ORDER BY status;
  `);
  const modeDistributionResult = await db.execute(sql`
    SELECT mode, COUNT(*) AS count
    FROM hackathons
    GROUP BY mode
    ORDER BY mode;
  `);
  const themeDistributionResult = await db.execute(sql`
    SELECT unnest(themes) AS theme, COUNT(*) AS count
    FROM hackathons
    GROUP BY theme
    ORDER BY count DESC;
  `);
  const deadlineCheckResult = await db.execute(sql`
    SELECT title, registration_deadline, status
    FROM hackathons
    WHERE registration_deadline IS NOT NULL
    ORDER BY registration_deadline ASC
    LIMIT 10;
  `);
  const scrapeLogsResult = await db.execute(sql`
    SELECT *
    FROM scrape_logs
    ORDER BY started_at DESC
    LIMIT 5;
  `);

  printSection('Total Hackathons:', rowsFromResult(totalCountResult));
  printSection('Status Distribution:', rowsFromResult(statusDistributionResult));
  printSection('Mode Distribution:', rowsFromResult(modeDistributionResult));
  printSection('Theme Distribution:', rowsFromResult(themeDistributionResult));
  printSection('Deadline Check:', rowsFromResult(deadlineCheckResult));
  printSection('Scrape Logs:', rowsFromResult(scrapeLogsResult));

  console.info('[Validation] Data quality checks complete.');
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

function printSection(title: string, rows: ResultRow[]): void {
  console.info(`\n${title}`);

  if (rows.length === 0) {
    console.info('No rows returned.');
    return;
  }

  console.table(rows);
}