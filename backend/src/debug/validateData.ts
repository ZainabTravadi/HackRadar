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

  const aggregateScrapeResult = await db.execute(sql`
    SELECT
      COALESCE(SUM(records_found), 0) AS total_found,
      COALESCE(SUM(records_new), 0) AS total_new,
      COALESCE(SUM(records_updated), 0) AS total_updated,
      COALESCE(AVG(CASE WHEN records_found > 0 THEN (records_new::float / records_found) END), 0) AS avg_new_rate
    FROM scrape_logs;
  `);

  const duplicateCountResult = await db.execute(sql`
    SELECT COUNT(*) AS duplicates FROM hackathons WHERE is_duplicate = true;
  `);

  const missingDeadlineResult = await db.execute(sql`
    SELECT COUNT(*) AS missing_deadline
    FROM hackathons
    WHERE registration_deadline IS NULL AND submission_deadline IS NULL AND start_date IS NULL AND end_date IS NULL;
  `);

  const missingOrganizerResult = await db.execute(sql`
    SELECT COUNT(*) AS missing_organizer FROM hackathons WHERE organizer_name IS NULL OR organizer_name = '';
  `);

  const missingDescriptionResult = await db.execute(sql`
    SELECT COUNT(*) AS missing_description FROM hackathons WHERE description IS NULL OR description = '';
  `);

  printSection('Total Hackathons:', rowsFromResult(totalCountResult));
  printSection('Status Distribution:', rowsFromResult(statusDistributionResult));
  printSection('Mode Distribution:', rowsFromResult(modeDistributionResult));
  printSection('Theme Distribution:', rowsFromResult(themeDistributionResult));
  printSection('Deadline Check:', rowsFromResult(deadlineCheckResult));
  printSection('Scrape Logs:', rowsFromResult(scrapeLogsResult));

  // Aggregated metrics
  const aggregateRows = rowsFromResult(aggregateScrapeResult);
  const duplicatesRows = rowsFromResult(duplicateCountResult);
  const missingDeadlineRows = rowsFromResult(missingDeadlineResult);
  const missingOrganizerRows = rowsFromResult(missingOrganizerResult);
  const missingDescriptionRows = rowsFromResult(missingDescriptionResult);

  console.info('\n📦 Aggregated Scrape Metrics:');
  if (aggregateRows.length > 0) {
    const agg = aggregateRows[0];
    console.info(`- total_found: ${agg.total_found}`);
    console.info(`- total_new: ${agg.total_new}`);
    console.info(`- total_updated: ${agg.total_updated}`);
    console.info(`- avg_new_rate: ${Number(agg.avg_new_rate).toFixed(3)}`);
  }

  console.info('\n🔁 Duplicates:');
  console.info(`- duplicates_in_db: ${duplicatesRows[0]?.duplicates ?? 0}`);

  console.info('\n⚠️ Missing Fields:');
  console.info(`- missing_deadline: ${missingDeadlineRows[0]?.missing_deadline ?? 0}`);
  console.info(`- missing_organizer: ${missingOrganizerRows[0]?.missing_organizer ?? 0}`);
  console.info(`- missing_description: ${missingDescriptionRows[0]?.missing_description ?? 0}`);

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