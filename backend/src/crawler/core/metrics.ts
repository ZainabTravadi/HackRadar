import { eq, desc, gte } from 'drizzle-orm';

import { db } from '../../db';
import { crawlerMetrics, scrapeLogs } from '../../db/schema';

export interface SourceMetrics {
  source: string;
  lastCrawlAt?: Date | null;
  lastSuccessAt?: Date | null;
  durationMs: number;
  requests: number;
  failures: number;
  successRate: number;
  averageResponseTimeMs: number;
  recordsFound: number;
  recordsUpdated: number;
}

export interface DetailedQualityMetrics {
  source: string;
  crawlType: 'discovery' | 'primary' | 'incremental';
  timestamp: Date;
  durationMs: number;
  requests: number;
  averageResponseTimeMs: number;
  
  // Page fetching
  pagesFetched: number;
  
  // Page classifications
  pageClassifications: Record<string, number>;
  
  // Link discovery
  linksDiscovered: number;
  candidateEvents: number;
  
  // Acceptance
  acceptedEvents: number;
  acceptanceRate: number;
  
  // Rejections (by category)
  rejectedNavigationLinks: number;
  rejectedAssets: number;
  rejectedDuplicates: number;
  rejectedInvalidPages: number;
  rejectedMalformedDates: number;
  rejectedInsufficientEvidence: number;
  rejectedBlockedTitles: number;
  rejectedBlockedUrls: number;
  rejectedBlockedExtensions: number;
  
  // Validation failures
  validationFailures: number;
  
  // Errors
  parserErrors: number;
  failures: number;
  
  // Discovery metrics (for discovery sources)
  discoveryUrlsFound?: number;
  discoveryCanonicalUrls?: number;
  discoveryDuplicates?: number;
  discoveryQueued?: number;
  discoveryIgnored?: number;
}

export async function updateMetrics(source: string, summary: Partial<SourceMetrics>): Promise<void> {
  const current = await db.select().from(scrapeLogs).where(eq(scrapeLogs.source, source as never)).orderBy(desc(scrapeLogs.startedAt)).limit(1);
  if (current.length === 0) {
    return;
  }
}

export async function recordDetailedMetrics(metrics: DetailedQualityMetrics): Promise<void> {
  await db.insert(crawlerMetrics).values({
    source: metrics.source as any,
    crawlType: metrics.crawlType,
    startedAt: metrics.timestamp,
    completedAt: new Date(metrics.timestamp.getTime() + metrics.durationMs),
    durationMs: metrics.durationMs,
    requests: metrics.requests,
    avgResponseTimeMs: metrics.averageResponseTimeMs,
    itemsFound: metrics.linksDiscovered,
    itemsNew: metrics.acceptedEvents,
    itemsUpdated: 0,
    duplicates: metrics.rejectedDuplicates,
    rejected: metrics.rejectedNavigationLinks + metrics.rejectedAssets + metrics.rejectedInvalidPages + metrics.rejectedMalformedDates + metrics.rejectedInsufficientEvidence + metrics.rejectedBlockedTitles + metrics.rejectedBlockedUrls + metrics.rejectedBlockedExtensions,
    validationFailures: metrics.validationFailures,
    retryCount: 0,
    failureCount: metrics.failures,
    success: metrics.failures === 0,
    errorMessage: metrics.failures > 0 ? 'Crawl had failures' : null,
    skipped: false,
  });
}

export async function getQualityReport(source?: string, hours = 24): Promise<DetailedQualityMetrics[]> {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  const whereClause = source 
    ? eq(crawlerMetrics.source, source as any)
    : gte(crawlerMetrics.startedAt, since);
  const results = await db.select().from(crawlerMetrics).where(whereClause).orderBy(desc(crawlerMetrics.startedAt)).limit(100);
  
  return results.map(r => ({
    source: r.source,
    crawlType: r.crawlType as any,
    timestamp: r.startedAt,
    durationMs: r.durationMs || 0,
    requests: r.requests,
    averageResponseTimeMs: r.avgResponseTimeMs || 0,
    pagesFetched: 0, // Not stored in current schema
    pageClassifications: {},
    linksDiscovered: r.itemsFound,
    candidateEvents: r.itemsFound,
    acceptedEvents: r.itemsNew,
    acceptanceRate: r.itemsFound > 0 ? (r.itemsNew / r.itemsFound) * 100 : 0,
    rejectedNavigationLinks: 0,
    rejectedAssets: 0,
    rejectedDuplicates: r.duplicates,
    rejectedInvalidPages: 0,
    rejectedMalformedDates: 0,
    rejectedInsufficientEvidence: 0,
    rejectedBlockedTitles: 0,
    rejectedBlockedUrls: 0,
    rejectedBlockedExtensions: 0,
    validationFailures: r.validationFailures || 0,
    parserErrors: 0,
    failures: r.failureCount,
  }));
}