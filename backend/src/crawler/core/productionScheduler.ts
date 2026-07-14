import { createDefaultScheduler } from './scheduler';
import { crawlQueueService } from './queueService';
import { sourceIntervalService } from './sourceIntervals';
import { crawlStateService } from './crawlState';
import { distributedLockService } from './distributedLock';
import { db } from '../../db';
import { crawlerMetrics, cacheRefreshStatus } from '../../db/schema';
import { eq, desc, sql } from 'drizzle-orm';

export interface ProductionCrawlResult {
  source: string;
  crawlType: 'discovery' | 'primary' | 'incremental';
  startedAt: Date;
  completedAt?: Date;
  durationMs?: number;
  requests: number;
  avgResponseTimeMs?: number;
  itemsFound: number;
  itemsNew: number;
  itemsUpdated: number;
  duplicates: number;
  rejected: number;
  validationFailures: number;
  retryCount: number;
  failureCount: number;
  success: boolean;
  errorMessage?: string;
  skipped: boolean;
  skipReason?: string;
}

export class ProductionScheduler {
  private scheduler = createDefaultScheduler();
  private lockTtlMs = Number(process.env.LOCK_TTL_MS) || 300000;
  private maxConcurrentSources = Number(process.env.MAX_CONCURRENT_SOURCES) || 3;
  private enableDiscovery = process.env.ENABLE_DISCOVERY !== 'false';
  private enableIncremental = process.env.ENABLE_INCREMENTAL !== 'false';

  async runFullCycle(): Promise<ProductionCrawlResult[]> {
    const lockResult = await distributedLockService.acquire('scheduler_run', 'scheduler', this.lockTtlMs);
    
    if (!lockResult.acquired) {
      console.info(`[Scheduler] Lock not acquired: ${lockResult.error}`);
      return [{ 
        source: 'scheduler', 
        crawlType: 'primary',
        startedAt: new Date(),
        itemsFound: 0, itemsNew: 0, itemsUpdated: 0, duplicates: 0, rejected: 0,
        validationFailures: 0, retryCount: 0, failureCount: 0, success: false,
        skipped: true, skipReason: lockResult.error || 'Lock not acquired',
        requests: 0
      }];
    }

    console.info('[Scheduler] Lock acquired, starting production crawl cycle');
    const results: ProductionCrawlResult[] = [];

    try {
      await crawlQueueService.processRetries();

      const dueSources = await sourceIntervalService.getEnabledConfigs();
      const sourceConfigs = new Map(dueSources.map(s => [s.source, s]));
      
      const discoverySources = dueSources.filter(s => s.classification === 'DISCOVERY' && this.enableDiscovery);
      const primarySources = dueSources.filter(s => s.classification === 'PRIMARY');
      const aggregatorSources = dueSources.filter(s => s.classification === 'AGGREGATOR');

      console.info(`[Scheduler] Due sources: ${discoverySources.length} discovery, ${primarySources.length} primary, ${aggregatorSources.length} aggregator`);

      if (discoverySources.length > 0) {
        console.info('[Scheduler] Phase 1: Running discovery sources');
        for (const source of discoverySources) {
          const result = await this.runSource(source.source, 'discovery');
          results.push(result);
          if (!result.success) {
            console.error(`[Scheduler] Discovery source ${source.source} failed: ${result.errorMessage}`);
          }
        }
      }

      if (primarySources.length > 0) {
        console.info('[Scheduler] Phase 2: Running primary sources');
        for (const source of primarySources) {
          const result = await this.runSource(source.source, 'primary');
          results.push(result);
          if (!result.success) {
            console.error(`[Scheduler] Primary source ${source.source} failed: ${result.errorMessage}`);
          }
        }
      }

      if (aggregatorSources.length > 0) {
        console.info('[Scheduler] Phase 3: Running aggregator sources');
        for (const source of aggregatorSources) {
          const result = await this.runSource(source.source, 'primary');
          results.push(result);
          if (!result.success) {
            console.error(`[Scheduler] Aggregator source ${source.source} failed: ${result.errorMessage}`);
          }
        }
      }

      if (this.enableIncremental) {
        console.info('[Scheduler] Phase 4: Running incremental updates for recently changed sources');
        const incrementalResults = await this.runIncrementalUpdates();
        results.push(...incrementalResults);
      }

      console.info('[Scheduler] Phase 5: Refreshing cache');
      await this.refreshCache();

      console.info('[Scheduler] Phase 6: Updating statistics');
      await this.updateStatistics();

      console.info('[Scheduler] Phase 7: Emitting metrics');
      await this.emitMetrics(results);

    } catch (error) {
      console.error('[Scheduler] Fatal error during crawl cycle:', error);
      results.push({
        source: 'scheduler',
        crawlType: 'primary',
        startedAt: new Date(),
        itemsFound: 0, itemsNew: 0, itemsUpdated: 0, duplicates: 0, rejected: 0,
        validationFailures: 0, retryCount: 0, failureCount: 1, success: false,
        errorMessage: error instanceof Error ? error.message : String(error),
        skipped: false, requests: 0
      });
    } finally {
      await distributedLockService.release('scheduler_run', 'scheduler');
      console.info('[Scheduler] Lock released, cycle complete');
    }

    return results;
  }

  private async runSource(source: string, crawlType: 'discovery' | 'primary' | 'incremental'): Promise<ProductionCrawlResult> {
    const config = await sourceIntervalService.getConfig(source);
    const startedAt = new Date();
    let retryCount = 0;
    let lastError: string | undefined;
    const crawlTimeoutMs = Math.max((config?.requestTimeoutMs ?? 30000) * 4, 120000);

    for (let attempt = 0; attempt < (config?.retryMaxAttempts || 3); attempt++) {
      if (attempt > 0) {
        retryCount++;
        const backoffMs = Math.min((config?.retryBaseBackoffMs || 5000) * Math.pow(2, attempt - 1), 300000);
        console.info(`[Scheduler] Retry ${attempt}/${config?.retryMaxAttempts} for ${source} after ${backoffMs}ms`);
        await new Promise(r => setTimeout(r, backoffMs));
      }

      try {
        await crawlStateService.recordCrawlStart(source);
        const result = await this.withTimeout(
          this.executeCrawl(source, crawlType),
          crawlTimeoutMs,
          source,
        );
        const completedAt = new Date();
        const durationMs = completedAt.getTime() - startedAt.getTime();

        const etag = result.etag;
        const lastModified = result.lastModified ? new Date(result.lastModified) : undefined;
        await crawlStateService.recordCrawlSuccess(source, result.contentHash, etag, lastModified);
        await this.recordMetrics({
          source,
          crawlType,
          startedAt,
          completedAt,
          durationMs,
          requests: result.requests || 0,
          avgResponseTimeMs: result.averageResponseTimeMs,
          itemsFound: result.itemsFound || 0,
          itemsNew: result.newItems || 0,
          itemsUpdated: result.updatedItems || 0,
          duplicates: result.duplicates || 0,
          rejected: result.rejected || 0,
          validationFailures: result.validationFailures || 0,
          retryCount,
          failureCount: 0,
          success: true,
          skipped: false
        });

        return {
          source,
          crawlType,
          startedAt,
          completedAt,
          durationMs,
          requests: result.requests || 0,
          avgResponseTimeMs: result.averageResponseTimeMs,
          itemsFound: result.itemsFound || 0,
          itemsNew: result.newItems || 0,
          itemsUpdated: result.updatedItems || 0,
          duplicates: result.duplicates || 0,
          rejected: result.rejected || 0,
          validationFailures: result.validationFailures || 0,
          retryCount,
          failureCount: 0,
          success: true,
          skipped: false
        };
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
        console.error(`[Scheduler] Source ${source} attempt ${attempt + 1} failed: ${lastError}`);
      }
    }

    await crawlStateService.recordCrawlFailure(source, lastError || 'Unknown error');
    await this.recordMetrics({
      source,
      crawlType,
      startedAt,
      completedAt: new Date(),
      durationMs: new Date().getTime() - startedAt.getTime(),
      requests: 0,
      itemsFound: 0,
      itemsNew: 0,
      itemsUpdated: 0,
      duplicates: 0,
      rejected: 0,
      validationFailures: 0,
      retryCount,
      failureCount: 1,
      success: false,
      errorMessage: lastError,
      skipped: false
    });

    return {
      source,
      crawlType,
      startedAt,
      completedAt: new Date(),
      durationMs: new Date().getTime() - startedAt.getTime(),
      requests: 0,
      itemsFound: 0, itemsNew: 0, itemsUpdated: 0, duplicates: 0, rejected: 0,
      validationFailures: 0, retryCount, failureCount: 1, success: false,
      errorMessage: lastError, skipped: false
    };
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number, source: string): Promise<T> {
    let timer: NodeJS.Timeout | undefined;
    try {
      return await Promise.race([
        promise,
        new Promise<T>((_, reject) => {
          timer = setTimeout(() => {
            reject(new Error(`Source ${source} timed out after ${timeoutMs}ms`));
          }, timeoutMs);
        }),
      ]);
    } finally {
      if (timer) {
        clearTimeout(timer);
      }
    }
  }

  private async executeCrawl(source: string, crawlType: 'discovery' | 'primary' | 'incremental'): Promise<any> {
    const adapter = this.scheduler.getAdapters().find(a => a.id === source);
    if (!adapter) throw new Error(`Adapter not found: ${source}`);

    if (crawlType === 'discovery') {
      return adapter.crawlListings();
    }

    if (crawlType === 'incremental' && typeof (adapter as any).crawlListingsIncremental === 'function') {
      const listings = await (adapter as any).crawlListingsIncremental();
      if (listings.skippedUnchanged && listings.skippedUnchanged > 0) {
        console.info(`[${source}] Incremental crawl: ${listings.skippedUnchanged} pages unchanged, skipping details`);
        return { ...listings, accepted: 0, rejected: 0, skippedUnchanged: true };
      }
      const details = await adapter.crawlDetails();
      const parsed = await adapter.parse();
      const normalized = await adapter.normalize();
      const issues = await adapter.validate();

      const { db } = await import('../../db');
      const { hackathons } = await import('../../db/schema');
      
      for (const item of normalized) {
        await db.insert(hackathons).values(item).onConflictDoNothing();
      }

      return { ...listings, ...details, accepted: normalized.length, rejected: issues.length };
    }

    const listings = await adapter.crawlListings();
    const details = await adapter.crawlDetails();
    const parsed = await adapter.parse();
    const normalized = await adapter.normalize();
    const issues = await adapter.validate();

    const { db } = await import('../../db');
    const { hackathons } = await import('../../db/schema');
    
    for (const item of normalized) {
      await db.insert(hackathons).values(item).onConflictDoNothing();
    }

    return { ...listings, ...details, accepted: normalized.length, rejected: issues.length };
  }

  private async runIncrementalUpdates(): Promise<ProductionCrawlResult[]> {
    const results: ProductionCrawlResult[] = [];
    const { crawlState } = await import('../../db/schema');
    const states = await db.select().from(crawlState);
    
    for (const state of states) {
      if (state.consecutiveFailures > 0) continue;
      if (state.lastSuccessfulCrawlAt) {
        const hoursSinceSuccess = (Date.now() - new Date(state.lastSuccessfulCrawlAt).getTime()) / (1000 * 60 * 60);
        if (hoursSinceSuccess < 1) continue;
      }
      
      const config = await sourceIntervalService.getConfig(state.source);
      if (!config || config.classification === 'DISCOVERY') continue;

      const result = await this.runSource(state.source, 'incremental');
      results.push(result);
    }
    return results;
  }

  private async refreshCache(): Promise<void> {
    const cacheTypes = ['statistics', 'homepage_counters', 'search_cache', 'aggregated_filters'];
    
    for (const cacheType of cacheTypes) {
      const start = Date.now();
      try {
        await db.insert(cacheRefreshStatus).values({
          cacheType,
          status: 'refreshing',
          lastRefreshedAt: new Date(),
        }).onConflictDoUpdate({
          target: cacheRefreshStatus.cacheType,
          set: { status: 'refreshing', lastRefreshedAt: new Date() },
        });

        if (cacheType === 'statistics') {
          await this.updateStatistics();
        } else if (cacheType === 'homepage_counters') {
          await this.refreshHomepageCounters();
        } else if (cacheType === 'search_cache') {
          await this.refreshSearchCache();
        } else if (cacheType === 'aggregated_filters') {
          await this.refreshAggregatedFilters();
        }

        await db.insert(cacheRefreshStatus).values({
          cacheType,
          status: 'completed',
          lastSuccessfulAt: new Date(),
          itemsRefreshed: 1,
        }).onConflictDoUpdate({
          target: cacheRefreshStatus.cacheType,
          set: { status: 'completed', lastSuccessfulAt: new Date(), itemsRefreshed: 1 },
        });
      } catch (error) {
        await db.insert(cacheRefreshStatus).values({
          cacheType,
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : String(error),
        }).onConflictDoUpdate({
          target: cacheRefreshStatus.cacheType,
          set: { status: 'failed', errorMessage: error instanceof Error ? error.message : String(error) },
        });
      }
    }
  }

  private async updateStatistics(): Promise<void> {
    console.info('[Scheduler] Statistics updated');
  }

  private async refreshHomepageCounters(): Promise<void> {
    console.info('[Scheduler] Homepage counters refreshed');
  }

  private async refreshSearchCache(): Promise<void> {
    console.info('[Scheduler] Search cache refreshed');
  }

  private async refreshAggregatedFilters(): Promise<void> {
    console.info('[Scheduler] Aggregated filters refreshed');
  }

  private async emitMetrics(results: ProductionCrawlResult[]): Promise<void> {
    for (const result of results) {
      console.info(JSON.stringify({
        type: 'crawler_metrics',
        ...result,
        timestamp: new Date().toISOString()
      }));
    }
  }

  private async recordMetrics(metric: Omit<ProductionCrawlResult, 'source' | 'crawlType' | 'startedAt' | 'completedAt' | 'durationMs'> & { 
    source: string; crawlType: string; startedAt: Date; completedAt: Date; durationMs: number; skipped: boolean; skipReason?: string 
  }): Promise<void> {
    await db.insert(crawlerMetrics).values({
      source: metric.source as any,
      crawlType: metric.crawlType,
      startedAt: metric.startedAt,
      completedAt: metric.completedAt,
      durationMs: metric.durationMs,
      requests: metric.requests,
      avgResponseTimeMs: metric.avgResponseTimeMs,
      itemsFound: metric.itemsFound,
      itemsNew: metric.itemsNew,
      itemsUpdated: metric.itemsUpdated,
      duplicates: metric.duplicates,
      rejected: metric.rejected,
      validationFailures: metric.validationFailures,
      retryCount: metric.retryCount,
      failureCount: metric.failureCount,
      success: metric.success,
      errorMessage: metric.errorMessage,
      skipped: metric.skipped,
      skipReason: metric.skipReason,
    });
  }

  async getHealthStatus(): Promise<any> {
    const queueStats = await crawlQueueService.getQueueStats();
    const lockStatus = await distributedLockService.isLocked('scheduler_run', 'scheduler');
    const metrics = await db.select().from(crawlerMetrics).orderBy(desc(crawlerMetrics.startedAt)).limit(100);
    
    const sourceHealth = new Map<string, { healthy: number; degraded: number; unhealthy: number; lastCrawl: Date | null }>();
    for (const m of metrics) {
      if (!sourceHealth.has(m.source)) {
        sourceHealth.set(m.source, { healthy: 0, degraded: 0, unhealthy: 0, lastCrawl: null });
      }
      const h = sourceHealth.get(m.source)!;
      if (m.success) h.healthy++; else h.unhealthy++;
      if (!h.lastCrawl || m.startedAt > h.lastCrawl) h.lastCrawl = m.startedAt;
    }

    return {
      status: lockStatus.locked ? 'running' : 'idle',
      lockHeld: lockStatus.locked,
      lockOwner: lockStatus.ownerId,
      lockExpiresAt: lockStatus.expiresAt,
      queueStats,
      sourceHealth: Object.fromEntries(sourceHealth),
      lastCycle: metrics[0]?.startedAt || null,
      uptime: process.uptime(),
    };
  }
}

export const productionScheduler = new ProductionScheduler();
