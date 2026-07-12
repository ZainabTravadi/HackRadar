import { db } from '../../db';
import { crawlQueue, retryQueue, deadLetterQueue, discoveryQueue } from '../../db/schema';
import { eq, and, lte, asc, desc, lt, gte, sql } from 'drizzle-orm';
import { sourceIntervalService } from './sourceIntervals';

export interface QueueJob {
  id: string;
  source: string;
  classification: string;
  priority: number;
  status: string;
  scheduledAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  attempts: number;
  maxAttempts: number;
  lastError?: string;
}

export class CrawlQueueService {
  async enqueueDiscoveryJobs(jobs: Array<{ source: string; discoveredUrl: string; canonicalUrl: string; ownerAdapter: string }>): Promise<number> {
    if (jobs.length === 0) return 0;
    
    let enqueued = 0;
    for (const job of jobs) {
      const result = await db.insert(discoveryQueue).values({
        source: job.source,
        discoveredUrl: job.discoveredUrl,
        canonicalUrl: job.canonicalUrl,
        ownerAdapter: job.ownerAdapter,
        status: 'queued',
      }).onConflictDoNothing().returning({ id: discoveryQueue.id });
      
      if (result.length > 0) enqueued++;
    }
    return enqueued;
  }

  async getDiscoveryJobs(limit = 100): Promise<Array<{ id: string; source: string; discoveredUrl: string; canonicalUrl: string; ownerAdapter: string }>> {
    return db.select()
      .from(discoveryQueue)
      .where(eq(discoveryQueue.status, 'queued'))
      .orderBy(asc(discoveryQueue.discoveredAt))
      .limit(limit);
  }

  async markDiscoveryProcessing(id: string): Promise<void> {
    await db.update(discoveryQueue)
      .set({ status: 'processing', lastSeenAt: new Date() })
      .where(eq(discoveryQueue.id, id));
  }

  async markDiscoveryCompleted(id: string): Promise<void> {
    await db.update(discoveryQueue)
      .set({ status: 'completed', lastSeenAt: new Date() })
      .where(eq(discoveryQueue.id, id));
  }

  async markDiscoveryFailed(id: string, error: string): Promise<void> {
    await db.update(discoveryQueue)
      .set({ status: 'failed', lastSeenAt: new Date() })
      .where(eq(discoveryQueue.id, id));
  }

  async enqueueCrawlJob(source: string, classification: string, priority = 0): Promise<string> {
    const result = await db.insert(crawlQueue).values({
      source: source as any,
      classification: classification as any,
      priority,
      status: 'queued',
      scheduledAt: new Date(),
      maxAttempts: 3,
    }).returning({ id: crawlQueue.id });
    
    return result[0]?.id || '';
  }

  async getNextJob(): Promise<QueueJob | null> {
    const now = new Date();
    const job = await db.select()
      .from(crawlQueue)
      .where(and(
        eq(crawlQueue.status, 'queued'),
        lte(crawlQueue.scheduledAt, now)
      ))
      .orderBy(asc(crawlQueue.priority), asc(crawlQueue.scheduledAt))
      .limit(1);

    if (job.length === 0) return null;
    return this.mapJob(job[0]);
  }

  async getDueJobs(limit = 50): Promise<QueueJob[]> {
    const now = new Date();
    const jobs = await db.select()
      .from(crawlQueue)
      .where(and(
        eq(crawlQueue.status, 'queued'),
        lte(crawlQueue.scheduledAt, now)
      ))
      .orderBy(asc(crawlQueue.priority), asc(crawlQueue.scheduledAt))
      .limit(limit);

    return jobs.map(this.mapJob);
  }

  async markProcessing(id: string): Promise<void> {
    await db.update(crawlQueue)
      .set({ status: 'processing', startedAt: new Date(), attempts: sql`${crawlQueue.attempts} + 1` })
      .where(eq(crawlQueue.id, id));
  }

  async markCompleted(id: string): Promise<void> {
    await db.update(crawlQueue)
      .set({ status: 'completed', completedAt: new Date() })
      .where(eq(crawlQueue.id, id));
  }

  async markFailed(id: string, error: string): Promise<void> {
    const job = await db.select().from(crawlQueue).where(eq(crawlQueue.id, id)).limit(1);
    if (job.length === 0) return;

    const currentJob = job[0];
    const nextAttempt = currentJob.attempts + 1;

    if (nextAttempt >= currentJob.maxAttempts) {
      await this.moveToDeadLetter(currentJob.id, currentJob.source, nextAttempt, currentJob.maxAttempts, error);
    } else {
      const backoffMs = Math.min(5000 * Math.pow(2, nextAttempt - 1), 300000);
      const nextRetryAt = new Date(Date.now() + backoffMs);

      await db.insert(retryQueue).values({
        crawlQueueId: currentJob.id,
        source: currentJob.source,
        attempt: nextAttempt,
        maxAttempts: currentJob.maxAttempts,
        nextRetryAt,
        backoffMs,
        lastError: error,
      });

      await db.update(crawlQueue)
        .set({ status: 'queued', scheduledAt: nextRetryAt, lastError: error, attempts: nextAttempt })
        .where(eq(crawlQueue.id, currentJob.id));
    }
  }

  private async moveToDeadLetter(crawlQueueId: string, source: string, attempts: number, maxAttempts: number, error: string): Promise<void> {
    await db.insert(deadLetterQueue).values({
      crawlQueueId,
      source: source as any,
      attempts,
      maxAttempts,
      finalError: error,
      payload: JSON.stringify({ source, attempts, maxAttempts }),
    });

    await db.update(crawlQueue)
      .set({ status: 'dead_letter', lastError: error, completedAt: new Date() })
      .where(eq(crawlQueue.id, crawlQueueId));
  }

  async processRetries(): Promise<number> {
    const now = new Date();
    const retries = await db.select()
      .from(retryQueue)
      .where(lte(retryQueue.nextRetryAt, now))
      .limit(50);

    let processed = 0;
    for (const retry of retries) {
      await db.update(crawlQueue)
        .set({ status: 'queued', scheduledAt: retry.nextRetryAt })
        .where(eq(crawlQueue.id, retry.crawlQueueId));

      await db.delete(retryQueue).where(eq(retryQueue.id, retry.id));
      processed++;
    }
    return processed;
  }

  async getQueueStats(): Promise<{
    crawlQueued: number;
    crawlProcessing: number;
    crawlCompleted: number;
    crawlFailed: number;
    crawlDeadLetter: number;
    retryPending: number;
    discoveryQueued: number;
    discoveryProcessing: number;
    deadLetterCount: number;
  }> {
    const [crawlStats, retryCount, discoveryStats, deadLetterCount] = await Promise.all([
      db.select({ status: crawlQueue.status, count: sql<number>`count(*)` }).from(crawlQueue).groupBy(crawlQueue.status),
      db.select({ count: sql<number>`count(*)` }).from(retryQueue),
      db.select({ status: discoveryQueue.status, count: sql<number>`count(*)` }).from(discoveryQueue).groupBy(discoveryQueue.status),
      db.select({ count: sql<number>`count(*)` }).from(deadLetterQueue),
    ]);

    const crawlMap = Object.fromEntries(crawlStats.map(s => [s.status, Number(s.count)]));
    const discoveryMap = Object.fromEntries(discoveryStats.map(s => [s.status, Number(s.count)]));

    return {
      crawlQueued: crawlMap.queued || 0,
      crawlProcessing: crawlMap.processing || 0,
      crawlCompleted: crawlMap.completed || 0,
      crawlFailed: crawlMap.failed || 0,
      crawlDeadLetter: crawlMap.dead_letter || 0,
      retryPending: Number(retryCount[0]?.count || 0),
      discoveryQueued: discoveryMap.queued || 0,
      discoveryProcessing: discoveryMap.processing || 0,
      deadLetterCount: Number(deadLetterCount[0]?.count || 0),
    };
  }

  async getDeadLetterJobs(limit = 50): Promise<Array<{ id: string; source: string; attempts: number; maxAttempts: number; finalError: string | null; createdAt: Date }>> {
    return db.select()
      .from(deadLetterQueue)
      .orderBy(desc(deadLetterQueue.createdAt))
      .limit(limit);
  }

  async retryDeadLetter(id: string): Promise<boolean> {
    const job = await db.select().from(deadLetterQueue).where(eq(deadLetterQueue.id, id)).limit(1);
    if (job.length === 0) return false;

    const deadJob = job[0];
    await this.enqueueCrawlJob(deadJob.source, 'PRIMARY', 10);
    await db.delete(deadLetterQueue).where(eq(deadLetterQueue.id, id));
    return true;
  }

  async clearDeadLetter(): Promise<number> {
    const result = await db.delete(deadLetterQueue);
    return result.rowCount || 0;
  }

  private mapJob(row: any): QueueJob {
    return {
      id: row.id,
      source: row.source,
      classification: row.classification,
      priority: row.priority,
      status: row.status,
      scheduledAt: row.scheduledAt,
      startedAt: row.startedAt,
      completedAt: row.completedAt,
      attempts: row.attempts,
      maxAttempts: row.maxAttempts,
      lastError: row.lastError,
    };
  }
}

export const crawlQueueService = new CrawlQueueService();