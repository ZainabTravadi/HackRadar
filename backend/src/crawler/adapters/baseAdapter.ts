import { eq } from 'drizzle-orm';

import { db } from '../../db';
import { hackathons } from '../../db/schema';
import { normalize, type RawHackathon } from '../../pipeline/normalizer';
import { Deduplicator } from '../core/deduplicator';
import { Fetcher } from '../core/fetcher';
import { Parser } from '../core/parser';
import { Validator } from '../core/validator';
import { storeRawCrawl } from '../core/rawCrawlStore';
import type { AdapterConfig, CrawlResult, RawResponseSnapshot, SourceAdapter } from '../core/types';
import type { NewHackathon } from '../../db/schema';

// Shared concrete behavior for every source adapter so adding a new source only needs a small subclass.
export abstract class BaseAdapter implements SourceAdapter {
  public abstract id: string;
  public abstract name: string;

  protected readonly fetcher = new Fetcher();
  protected readonly parser = new Parser();
  protected readonly validator = new Validator();
  protected readonly deduplicator = new Deduplicator();

  protected readonly config: AdapterConfig;
  protected parsedItems: RawHackathon[] = [];
  protected normalizedItems: NewHackathon[] = [];
  protected rawResponses: RawResponseSnapshot[] = [];

  protected constructor(config: AdapterConfig) {
    this.config = config;
  }

  async crawlListings(): Promise<CrawlResult> {
    const startedAt = Date.now();
    let requests = 0;
    let pages = 0;
    let itemsFound = 0;
    let newItems = 0;
    let updatedItems = 0;
    let duplicates = 0;
    let failed = 0;
    let totalResponseTime = 0;

    for (const url of this.listingUrls()) {
      try {
        const response = await this.fetchWithRetry(url);
        requests += 1;
        pages += 1;
        totalResponseTime += response.responseTimeMs;
        this.rawResponses.push(response);
        await storeRawCrawl({
          source: this.id,
          url: response.url,
          html: response.rawHtml ?? null,
          json: response.rawJson ?? null,
          headers: response.headers,
          statusCode: response.statusCode,
          responseTimeMs: response.responseTimeMs,
          timestamp: response.timestamp,
        });

        const parsed = this.parseResponse(response);
        this.parsedItems.push(...parsed);
        itemsFound += parsed.length;

        for (const item of parsed) {
          const isDuplicate = await this.deduplicator.isDuplicate(this.id, item.sourceId, item.sourceUrl);
          if (isDuplicate) {
            duplicates += 1;
            continue;
          }

          const validationIssues = this.validator.validate(item);
          if (validationIssues.length > 0) {
            failed += 1;
            continue;
          }

          const normalized = normalize(item);
          const existing = await db.select({ id: hackathons.id }).from(hackathons).where(eq(hackathons.source, this.id as never)).limit(1);
          if (existing.length === 0) {
            await db.insert(hackathons).values(normalized).onConflictDoNothing();
            newItems += 1;
          } else {
            await db.update(hackathons).set({ updatedAt: new Date(), rawData: normalized.rawData ?? null }).where(eq(hackathons.id, existing[0].id));
            updatedItems += 1;
          }
        }
      } catch (error: unknown) {
        failed += 1;
        console.error(`[${this.name}] listing fetch failed for ${url}: ${this.formatError(error)}`);
      }

      await this.delay(this.config.delayMs);
    }

    return {
      source: this.id,
      pages,
      itemsFound,
      newItems,
      updatedItems,
      duplicates,
      failed,
      durationMs: Date.now() - startedAt,
      requests,
      averageResponseTimeMs: requests > 0 ? Math.round(totalResponseTime / requests) : 0,
    };
  }

  async crawlDetails(): Promise<CrawlResult> {
    const startedAt = Date.now();
    let requests = 0;
    let pages = 0;
    let itemsFound = 0;
    let newItems = 0;
    let updatedItems = 0;
    let duplicates = 0;
    let failed = 0;
    let totalResponseTime = 0;

    for (const url of this.detailUrls()) {
      try {
        const response = await this.fetchWithRetry(url);
        requests += 1;
        pages += 1;
        totalResponseTime += response.responseTimeMs;
        this.rawResponses.push(response);
        const parsed = this.parseResponse(response);
        itemsFound += parsed.length;
        this.parsedItems.push(...parsed);
      } catch (error: unknown) {
        failed += 1;
        console.error(`[${this.name}] detail fetch failed for ${url}: ${this.formatError(error)}`);
      }

      await this.delay(this.config.delayMs);
    }

    return {
      source: this.id,
      pages,
      itemsFound,
      newItems,
      updatedItems,
      duplicates,
      failed,
      durationMs: Date.now() - startedAt,
      requests,
      averageResponseTimeMs: requests > 0 ? Math.round(totalResponseTime / requests) : 0,
    };
  }

  async parse(): Promise<unknown[]> {
    return this.parsedItems;
  }

  async normalize(): Promise<NewHackathon[]> {
    this.normalizedItems = this.parsedItems.map((item) => normalize(item));
    return this.normalizedItems;
  }

  async validate(): Promise<unknown[]> {
    return this.parsedItems.flatMap((item) => this.validator.validate(item));
  }

  protected listingUrls(): string[] {
    return [];
  }

  protected detailUrls(): string[] {
    return [];
  }

  protected buildPaginatedUrls(url: string, pageParam = 'page'): string[] {
    const maxPages = Math.max(1, this.config.maxPages ?? 1);
    const urls: string[] = [];

    for (let page = 1; page <= maxPages; page += 1) {
      try {
        const parsed = new URL(url);
        parsed.searchParams.set(pageParam, String(page));
        urls.push(parsed.toString());
      } catch {
        urls.push(`${url}${url.includes('?') ? '&' : '?'}${pageParam}=${page}`);
      }
    }

    return urls;
  }

  protected parseResponse(snapshot: RawResponseSnapshot): RawHackathon[] {
    if (snapshot.rawJson) {
      try {
        const payload = JSON.parse(snapshot.rawJson);
        return this.createRawHackathons(payload);
      } catch {
        return this.createRawHackathons(snapshot.rawHtml ?? '');
      }
    }

    return this.createRawHackathons(snapshot.rawHtml ?? '');
  }

  protected createRawHackathons(payload: unknown): RawHackathon[] {
    if (typeof payload === 'string' && payload.trim().length > 0) {
      return this.parser.parseHtml(payload, this.id);
    }

    if (payload && typeof payload === 'object' && Array.isArray((payload as Record<string, unknown>).items)) {
      return this.parser.parseHtml(JSON.stringify(payload), this.id);
    }

    return [];
  }

  protected async fetchWithRetry(url: string): Promise<RawResponseSnapshot> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        return await this.fetcher.fetch({
          url,
          timeoutMs: this.config.timeoutMs,
          headers: {
            'User-Agent': this.config.userAgent,
            ...(this.config.headers ?? {}),
          },
        });
      } catch (error: unknown) {
        lastError = error;
        if (attempt < 3) {
          await this.delay(this.config.retryAfterMs * attempt);
        }
      }
    }

    throw lastError instanceof Error ? lastError : new Error(String(lastError));
  }

  protected delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  protected formatError(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
