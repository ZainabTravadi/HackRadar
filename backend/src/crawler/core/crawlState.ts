import { db } from '../../db';
import { crawlState } from '../../db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

export interface CrawlStateData {
  source: string;
  lastCrawledAt?: Date;
  lastSuccessfulCrawlAt?: Date;
  contentHash?: string;
  etag?: string;
  lastModified?: Date;
  consecutiveFailures: number;
  totalCrawls: number;
  totalSuccesses: number;
  totalFailures: number;
  health: 'healthy' | 'degraded' | 'unhealthy';
  lastError?: string;
}

export class CrawlStateService {
  async getState(source: string): Promise<CrawlStateData | null> {
    const result = await db.select().from(crawlState).where(eq(crawlState.source, source as any)).limit(1);
    if (result.length === 0) return null;
    const row = result[0];
    return {
      source: row.source,
      lastCrawledAt: row.lastCrawledAt ?? undefined,
      lastSuccessfulCrawlAt: row.lastSuccessfulCrawlAt ?? undefined,
      contentHash: row.contentHash ?? undefined,
      etag: row.etag ?? undefined,
      lastModified: row.lastModified ?? undefined,
      consecutiveFailures: row.consecutiveFailures,
      totalCrawls: row.totalCrawls,
      totalSuccesses: row.totalSuccesses,
      totalFailures: row.totalFailures,
      health: row.health,
      lastError: row.lastError ?? undefined,
    };
  }

  async updateState(source: string, updates: Partial<CrawlStateData>): Promise<void> {
    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (updates.lastCrawledAt !== undefined) updateData.lastCrawledAt = updates.lastCrawledAt;
    if (updates.lastSuccessfulCrawlAt !== undefined) updateData.lastSuccessfulCrawlAt = updates.lastSuccessfulCrawlAt;
    if (updates.contentHash !== undefined) updateData.contentHash = updates.contentHash;
    if (updates.etag !== undefined) updateData.etag = updates.etag;
    if (updates.lastModified !== undefined) updateData.lastModified = updates.lastModified;
    if (updates.consecutiveFailures !== undefined) updateData.consecutiveFailures = updates.consecutiveFailures;
    if (updates.totalCrawls !== undefined) updateData.totalCrawls = updates.totalCrawls;
    if (updates.totalSuccesses !== undefined) updateData.totalSuccesses = updates.totalSuccesses;
    if (updates.totalFailures !== undefined) updateData.totalFailures = updates.totalFailures;
    if (updates.health !== undefined) updateData.health = updates.health;
    if (updates.lastError !== undefined) updateData.lastError = updates.lastError;

    await db.insert(crawlState).values({
      source: source as any,
      ...updateData,
    }).onConflictDoUpdate({
      target: crawlState.source,
      set: updateData,
    });
  }

  async recordCrawlStart(source: string): Promise<void> {
    const state = await this.getState(source);
    await this.updateState(source, {
      lastCrawledAt: new Date(),
      totalCrawls: (state?.totalCrawls ?? 0) + 1,
    });
  }

  async recordCrawlSuccess(source: string, contentHash?: string, etag?: string, lastModified?: Date): Promise<void> {
    const state = await this.getState(source);
    await this.updateState(source, {
      lastSuccessfulCrawlAt: new Date(),
      contentHash: contentHash || state?.contentHash,
      etag: etag || state?.etag,
      lastModified: lastModified || state?.lastModified,
      consecutiveFailures: 0,
      totalSuccesses: (state?.totalSuccesses || 0) + 1,
      health: 'healthy',
      lastError: undefined,
    });
  }

  async recordCrawlFailure(source: string, error: string): Promise<void> {
    const state = await this.getState(source);
    const consecutiveFailures = (state?.consecutiveFailures || 0) + 1;
    let health: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (consecutiveFailures >= 3) health = 'unhealthy';
    else if (consecutiveFailures >= 2) health = 'degraded';

    await this.updateState(source, {
      consecutiveFailures,
      totalFailures: (state?.totalFailures || 0) + 1,
      health,
      lastError: error,
    });
  }

  async isContentUnchanged(source: string, contentHash: string, etag?: string, lastModified?: Date): Promise<boolean> {
    const state = await this.getState(source);
    if (!state) return false;

    if (contentHash && state.contentHash === contentHash) return true;
    if (etag && state.etag === etag) return true;
    if (lastModified && state.lastModified && state.lastModified.getTime() === lastModified.getTime()) return true;

    return false;
  }

  computeContentHash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}

export const crawlStateService = new CrawlStateService();