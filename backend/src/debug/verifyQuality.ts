#!/usr/bin/env node
// Data quality verification report for a fresh crawl.

import 'dotenv/config';
import { db } from '../db';
import { hackathons } from '../db/schema';
import { computeHackathonStatus } from '../pipeline/status';

type HackathonRow = typeof hackathons.$inferSelect;

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

const SUSPICIOUS_TITLE_PATTERNS = [
  /^(?:view|save this event|share this event|sales end soon|just added)\b/i,
  /^(?:hackathons?|events?|challenges?)$/i,
  /^(?:upcoming|past|latest|recent|featured|trending|popular)$/i,
  /^(?:all hackathons|all events|upcoming hackathons|past hackathons|upcoming events|past events)$/i,
];

async function verifyDataQuality(): Promise<void> {
  console.info('\n[Verification] Starting data quality checks...\n');

  const rows = await db.select().from(hackathons);
  const sourceCounts = countBySource(rows);
  const statusCounts = countByStatus(rows);
  const suspiciousTitles = rows.filter((row) => isSuspiciousTitle(row.title));
  const missingDeadlineCount = rows.filter((row) => !hasAnyDeadline(row)).length;
  const missingOrganizerCount = rows.filter((row) => !trimmed(row.organizerName)).length;
  const unknownModeCount = rows.filter((row) => row.mode === 'unknown').length;
  const duplicateCount = rows.filter((row) => row.isDuplicate).length;
  const acceptanceCount = rows.filter((row) => isAccepted(row)).length;
  const acceptancePct = rows.length === 0 ? 0 : Math.round((acceptanceCount / rows.length) * 1000) / 10;

  console.info(`Total: ${rows.length}`);
  console.info(`Open: ${statusCounts.open}`);
  console.info(`Upcoming: ${statusCounts.upcoming}`);
  console.info(`Closing Soon: ${statusCounts.closing_soon}`);
  console.info(`Ended: ${statusCounts.ended}`);
  console.info(`Unknown Mode %: ${percentage(unknownModeCount, rows.length)}`);
  console.info(`Missing Organizer %: ${percentage(missingOrganizerCount, rows.length)}`);
  console.info(`Missing Deadline %: ${percentage(missingDeadlineCount, rows.length)}`);
  console.info(`Duplicate Count: ${duplicateCount}`);
  console.info('Suspicious Titles:');
  console.table(suspiciousTitles.slice(0, 15).map((row) => ({
    id: row.id,
    title: row.title,
    source: row.source,
    sourceUrl: row.sourceUrl,
  })));
  console.info('Top Sources:');
  console.table(topEntries(sourceCounts, 10));
  console.info(`Acceptance %: ${acceptancePct}`);
  console.info('\nAcceptance definition: meaningful title, has a deadline, not ended, and not suspicious.\n');

  const issues =
    suspiciousTitles.length +
    missingDeadlineCount +
    unknownModeCount +
    missingOrganizerCount +
    duplicateCount;

  console.info(`\n[Verification] Summary issues: ${issues}`);
  if (issues === 0) {
    console.info('[Verification] All quality checks passed.');
    return;
  }

  console.info('[Verification] Quality issues remain.');
  process.exitCode = 1;
}

function countBySource(rows: HackathonRow[]): Record<string, number> {
  return rows.reduce((acc, row) => {
    acc[row.source] = (acc[row.source] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

function countByStatus(rows: HackathonRow[]): Record<'open' | 'upcoming' | 'closing_soon' | 'ended', number> {
  const counts = { open: 0, upcoming: 0, closing_soon: 0, ended: 0 };

  for (const row of rows) {
    const status = computeHackathonStatus({
      registrationDeadline: row.registrationDeadline,
      submissionDeadline: row.submissionDeadline,
      startDate: row.startDate,
      endDate: row.endDate,
    });
    counts[status] += 1;
  }

  return counts;
}

function isAccepted(row: HackathonRow): boolean {
  const status = computeHackathonStatus({
    registrationDeadline: row.registrationDeadline,
    submissionDeadline: row.submissionDeadline,
    startDate: row.startDate,
    endDate: row.endDate,
  });

  return !isSuspiciousTitle(row.title) && hasAnyDeadline(row) && status !== 'ended';
}

function hasAnyDeadline(row: HackathonRow): boolean {
  return Boolean(row.registrationDeadline || row.submissionDeadline || row.startDate || row.endDate);
}

function isSuspiciousTitle(title: string): boolean {
  const normalized = trimmed(title).toLowerCase();
  if (!normalized) {
    return true;
  }

  if (GENERIC_TITLE_TERMS.some((term) => normalized === term || normalized.includes(term))) {
    return true;
  }

  return SUSPICIOUS_TITLE_PATTERNS.some((pattern) => pattern.test(normalized));
}

function trimmed(value: string | null | undefined): string {
  return (value ?? '').trim();
}

function percentage(part: number, total: number): string {
  if (total <= 0) {
    return '0.0%';
  }

  return `${Math.round((part / total) * 1000) / 10}%`;
}

function topEntries(counts: Record<string, number>, limit: number): Array<{ source: string; count: number }> {
  return Object.entries(counts)
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

verifyDataQuality()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Verification failed:', err);
    process.exit(1);
  });
