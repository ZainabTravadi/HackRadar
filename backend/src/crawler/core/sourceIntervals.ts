import { db } from '../../db';
import { sourceIntervals } from '../../db/schema';
import { eq } from 'drizzle-orm';

export type SourceKey = 
  | 'devpost' | 'mlh' | 'devfolio' | 'unstop' | 'dorahacks' | 'taikai' 
  | 'hackerearth' | 'hack2skill' | 'reskilll' | 'ethglobal' | 'lablab' | 'angelhack'
  | 'hackclub' | 'university' | 'eventbrite' | 'luma' | 'meetup' | 'github'
  | 'reddit' | 'discord' | 'telegram' | 'linkedin' | 'twitter' | 'facebook' | 'google' | 'manual';

export interface SourceIntervalConfig {
  source: SourceKey;
  intervalMinutes: number;
  classification: 'PRIMARY' | 'AGGREGATOR' | 'DISCOVERY';
  enabled: boolean;
  maxConcurrency: number;
  requestTimeoutMs: number;
  retryMaxAttempts: number;
  retryBaseBackoffMs: number;
  healthThresholdFailures: number;
}

export const DEFAULT_SOURCE_INTERVALS: Record<SourceKey, Omit<SourceIntervalConfig, 'source'>> = {
  devpost: { intervalMinutes: 5, classification: 'PRIMARY', enabled: true, maxConcurrency: 1, requestTimeoutMs: 30000, retryMaxAttempts: 3, retryBaseBackoffMs: 5000, healthThresholdFailures: 3 },
  mlh: { intervalMinutes: 10, classification: 'PRIMARY', enabled: true, maxConcurrency: 1, requestTimeoutMs: 30000, retryMaxAttempts: 3, retryBaseBackoffMs: 5000, healthThresholdFailures: 3 },
  devfolio: { intervalMinutes: 10, classification: 'PRIMARY', enabled: true, maxConcurrency: 1, requestTimeoutMs: 30000, retryMaxAttempts: 3, retryBaseBackoffMs: 5000, healthThresholdFailures: 3 },
  unstop: { intervalMinutes: 10, classification: 'PRIMARY', enabled: true, maxConcurrency: 1, requestTimeoutMs: 30000, retryMaxAttempts: 3, retryBaseBackoffMs: 5000, healthThresholdFailures: 3 },
  dorahacks: { intervalMinutes: 10, classification: 'PRIMARY', enabled: true, maxConcurrency: 1, requestTimeoutMs: 30000, retryMaxAttempts: 3, retryBaseBackoffMs: 5000, healthThresholdFailures: 3 },
  taikai: { intervalMinutes: 10, classification: 'PRIMARY', enabled: true, maxConcurrency: 1, requestTimeoutMs: 30000, retryMaxAttempts: 3, retryBaseBackoffMs: 5000, healthThresholdFailures: 3 },
  hackerearth: { intervalMinutes: 10, classification: 'PRIMARY', enabled: true, maxConcurrency: 1, requestTimeoutMs: 30000, retryMaxAttempts: 3, retryBaseBackoffMs: 5000, healthThresholdFailures: 3 },
  hack2skill: { intervalMinutes: 10, classification: 'PRIMARY', enabled: true, maxConcurrency: 1, requestTimeoutMs: 30000, retryMaxAttempts: 3, retryBaseBackoffMs: 5000, healthThresholdFailures: 3 },
  reskilll: { intervalMinutes: 10, classification: 'PRIMARY', enabled: true, maxConcurrency: 1, requestTimeoutMs: 30000, retryMaxAttempts: 3, retryBaseBackoffMs: 5000, healthThresholdFailures: 3 },
  ethglobal: { intervalMinutes: 15, classification: 'PRIMARY', enabled: true, maxConcurrency: 1, requestTimeoutMs: 30000, retryMaxAttempts: 3, retryBaseBackoffMs: 5000, healthThresholdFailures: 3 },
  lablab: { intervalMinutes: 10, classification: 'PRIMARY', enabled: true, maxConcurrency: 1, requestTimeoutMs: 30000, retryMaxAttempts: 3, retryBaseBackoffMs: 5000, healthThresholdFailures: 3 },
  angelhack: { intervalMinutes: 15, classification: 'PRIMARY', enabled: true, maxConcurrency: 1, requestTimeoutMs: 30000, retryMaxAttempts: 3, retryBaseBackoffMs: 5000, healthThresholdFailures: 3 },
  hackclub: { intervalMinutes: 30, classification: 'AGGREGATOR', enabled: true, maxConcurrency: 1, requestTimeoutMs: 30000, retryMaxAttempts: 3, retryBaseBackoffMs: 5000, healthThresholdFailures: 3 },
  university: { intervalMinutes: 60, classification: 'AGGREGATOR', enabled: true, maxConcurrency: 1, requestTimeoutMs: 30000, retryMaxAttempts: 3, retryBaseBackoffMs: 5000, healthThresholdFailures: 3 },
  eventbrite: { intervalMinutes: 30, classification: 'AGGREGATOR', enabled: true, maxConcurrency: 1, requestTimeoutMs: 30000, retryMaxAttempts: 3, retryBaseBackoffMs: 5000, healthThresholdFailures: 3 },
  meetup: { intervalMinutes: 30, classification: 'AGGREGATOR', enabled: true, maxConcurrency: 1, requestTimeoutMs: 30000, retryMaxAttempts: 3, retryBaseBackoffMs: 5000, healthThresholdFailures: 3 },
  luma: { intervalMinutes: 30, classification: 'AGGREGATOR', enabled: true, maxConcurrency: 1, requestTimeoutMs: 30000, retryMaxAttempts: 3, retryBaseBackoffMs: 5000, healthThresholdFailures: 3 },
  github: { intervalMinutes: 60, classification: 'DISCOVERY', enabled: true, maxConcurrency: 1, requestTimeoutMs: 30000, retryMaxAttempts: 3, retryBaseBackoffMs: 5000, healthThresholdFailures: 3 },
  reddit: { intervalMinutes: 60, classification: 'DISCOVERY', enabled: true, maxConcurrency: 1, requestTimeoutMs: 30000, retryMaxAttempts: 3, retryBaseBackoffMs: 5000, healthThresholdFailures: 3 },
  discord: { intervalMinutes: 60, classification: 'DISCOVERY', enabled: true, maxConcurrency: 1, requestTimeoutMs: 30000, retryMaxAttempts: 3, retryBaseBackoffMs: 5000, healthThresholdFailures: 3 },
  telegram: { intervalMinutes: 60, classification: 'DISCOVERY', enabled: true, maxConcurrency: 1, requestTimeoutMs: 30000, retryMaxAttempts: 3, retryBaseBackoffMs: 5000, healthThresholdFailures: 3 },
  linkedin: { intervalMinutes: 60, classification: 'DISCOVERY', enabled: true, maxConcurrency: 1, requestTimeoutMs: 30000, retryMaxAttempts: 3, retryBaseBackoffMs: 5000, healthThresholdFailures: 3 },
  twitter: { intervalMinutes: 60, classification: 'DISCOVERY', enabled: true, maxConcurrency: 1, requestTimeoutMs: 30000, retryMaxAttempts: 3, retryBaseBackoffMs: 5000, healthThresholdFailures: 3 },
  facebook: { intervalMinutes: 60, classification: 'DISCOVERY', enabled: true, maxConcurrency: 1, requestTimeoutMs: 30000, retryMaxAttempts: 3, retryBaseBackoffMs: 5000, healthThresholdFailures: 3 },
  google: { intervalMinutes: 60, classification: 'DISCOVERY', enabled: true, maxConcurrency: 1, requestTimeoutMs: 30000, retryMaxAttempts: 3, retryBaseBackoffMs: 5000, healthThresholdFailures: 3 },
  manual: { intervalMinutes: 60, classification: 'PRIMARY', enabled: true, maxConcurrency: 1, requestTimeoutMs: 30000, retryMaxAttempts: 3, retryBaseBackoffMs: 5000, healthThresholdFailures: 3 },
};

export class SourceIntervalService {
  async initializeDefaults(): Promise<void> {
    const existing = await db.select().from(sourceIntervals);
    const existingSources = new Set(existing.map(e => e.source));

    for (const [source, config] of Object.entries(DEFAULT_SOURCE_INTERVALS) as [SourceKey, Omit<SourceIntervalConfig, 'source'>][]) {
      if (!existingSources.has(source)) {
        await db.insert(sourceIntervals).values({
          source,
          ...config,
        }).onConflictDoNothing();
      }
    }
  }

  async getConfig(source: string): Promise<SourceIntervalConfig | null> {
    const result = await db.select().from(sourceIntervals).where(eq(sourceIntervals.source, source as any)).limit(1);
    if (result.length === 0) return null;
    const row = result[0];
    return {
      source: row.source,
      intervalMinutes: row.intervalMinutes,
      classification: row.classification,
      enabled: row.enabled,
      maxConcurrency: row.maxConcurrency,
      requestTimeoutMs: row.requestTimeoutMs,
      retryMaxAttempts: row.retryMaxAttempts,
      retryBaseBackoffMs: row.retryBaseBackoffMs,
      healthThresholdFailures: row.healthThresholdFailures,
    };
  }

  async getAllConfigs(): Promise<SourceIntervalConfig[]> {
    const results = await db.select().from(sourceIntervals);
    return results.map(row => ({
      source: row.source,
      intervalMinutes: row.intervalMinutes,
      classification: row.classification,
      enabled: row.enabled,
      maxConcurrency: row.maxConcurrency,
      requestTimeoutMs: row.requestTimeoutMs,
      retryMaxAttempts: row.retryMaxAttempts,
      retryBaseBackoffMs: row.retryBaseBackoffMs,
      healthThresholdFailures: row.healthThresholdFailures,
    }));
  }

  async getEnabledConfigs(): Promise<SourceIntervalConfig[]> {
    const results = await db.select().from(sourceIntervals).where(eq(sourceIntervals.enabled, true));
    return results.map(row => ({
      source: row.source,
      intervalMinutes: row.intervalMinutes,
      classification: row.classification,
      enabled: row.enabled,
      maxConcurrency: row.maxConcurrency,
      requestTimeoutMs: row.requestTimeoutMs,
      retryMaxAttempts: row.retryMaxAttempts,
      retryBaseBackoffMs: row.retryBaseBackoffMs,
      healthThresholdFailures: row.healthThresholdFailures,
    }));
  }

  async updateConfig(source: string, config: Partial<Omit<SourceIntervalConfig, 'source'>>): Promise<void> {
    await db.update(sourceIntervals)
      .set({ ...config, updatedAt: new Date() })
      .where(eq(sourceIntervals.source, source as any));
  }

  async isDue(source: string): Promise<boolean> {
    const config = await this.getConfig(source);
    if (!config || !config.enabled) return false;

    const { crawlState } = await import('../../db/schema');
    const state = await db.select().from(crawlState).where(eq(crawlState.source, source as any)).limit(1);

    if (state.length === 0 || !state[0].lastCrawledAt) return true;

    const lastCrawled = new Date(state[0].lastCrawledAt).getTime();
    const intervalMs = config.intervalMinutes * 60 * 1000;
    return Date.now() - lastCrawled >= intervalMs;
  }
}

export const sourceIntervalService = new SourceIntervalService();