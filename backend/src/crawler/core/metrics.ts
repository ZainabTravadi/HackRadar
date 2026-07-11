import { eq } from 'drizzle-orm';

import { db } from '../../db';
import { scrapeLogs } from '../../db/schema';

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

export async function updateMetrics(source: string, summary: Partial<SourceMetrics>): Promise<void> {
  const current = await db.select().from(scrapeLogs).where(eq(scrapeLogs.source, source as never)).orderBy(scrapeLogs.startedAt).limit(1);
  if (current.length === 0) {
    return;
  }
}
