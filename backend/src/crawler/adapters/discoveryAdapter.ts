import { Fetcher } from '../core/fetcher';
import { crawlQueueService } from '../core/queueService';
import { collectDiscoveryMetrics, type DiscoveryMetrics } from '../core/discoveryQueue';
import { storeRawCrawl } from '../core/rawCrawlStore';
import { crawlStateService } from '../core/crawlState';
import type { AdapterConfig, CrawlResult, RawResponseSnapshot, SourceAdapter } from '../core/types';
import type { NewHackathon } from '../../db/schema';

export interface QualityMetrics {
  pagesFetched: number;
  linksDiscovered: number;
  candidateEvents: number;
  rejectedNavigationLinks: number;
  rejectedAssets: number;
  rejectedDuplicates: number;
  rejectedInvalidPages: number;
  rejectedMalformedDates: number;
  rejectedInsufficientEvidence: number;
  rejectedBlockedTitles: number;
  rejectedBlockedUrls: number;
  rejectedBlockedExtensions: number;
  acceptedEvents: number;
  pageClassifications: Record<string, number>;
}

export abstract class DiscoveryAdapter implements SourceAdapter {
  public abstract id: string;
  public abstract name: string;

  protected readonly fetcher = new Fetcher();
  protected readonly config: AdapterConfig;
  protected rawResponses: RawResponseSnapshot[] = [];
  protected qualityMetrics: QualityMetrics = this.initQualityMetrics();
  public discoveryMetrics: DiscoveryMetrics = { urlsFound: 0, canonicalUrls: 0, duplicates: 0, queued: 0, ignored: 0 };

  protected constructor(config: AdapterConfig) {
    this.config = config;
  }

  private initQualityMetrics(): QualityMetrics {
    return {
      pagesFetched: 0,
      linksDiscovered: 0,
      candidateEvents: 0,
      rejectedNavigationLinks: 0,
      rejectedAssets: 0,
      rejectedDuplicates: 0,
      rejectedInvalidPages: 0,
      rejectedMalformedDates: 0,
      rejectedInsufficientEvidence: 0,
      rejectedBlockedTitles: 0,
      rejectedBlockedUrls: 0,
      rejectedBlockedExtensions: 0,
      acceptedEvents: 0,
      pageClassifications: {},
    };
  }

  async crawlListings(): Promise<CrawlResult> {
    const startedAt = Date.now();
    this.qualityMetrics = this.initQualityMetrics();
    this.discoveryMetrics = { urlsFound: 0, canonicalUrls: 0, duplicates: 0, queued: 0, ignored: 0 };
    let requests = 0;
    let pages = 0;
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

        // Discovery sources only discover URLs, they don't parse events
        if (response.rawHtml) {
          this.discoveryMetrics = await collectDiscoveryMetrics(response.rawHtml, response.url, this.id);
        }
      } catch (error: unknown) {
        console.error(`[${this.name}] discovery fetch failed for ${url}: ${this.formatError(error)}`);
      }

      await this.delay(this.config.delayMs);
    }

    this.qualityMetrics.pagesFetched = pages;
    this.qualityMetrics.linksDiscovered = this.discoveryMetrics.urlsFound;

    console.info(
      `[${this.name}] discovery quality pagesFetched=${pages} urlsFound=${this.discoveryMetrics.urlsFound} ` +
      `canonicalUrls=${this.discoveryMetrics.canonicalUrls} queued=${this.discoveryMetrics.queued} ` +
      `duplicates=${this.discoveryMetrics.duplicates} ignored=${this.discoveryMetrics.ignored}`
    );

    return {
      source: this.id,
      pages,
      itemsFound: this.discoveryMetrics.urlsFound,
      newItems: this.discoveryMetrics.queued,
      updatedItems: 0,
      duplicates: this.discoveryMetrics.duplicates,
      failed: 0,
      durationMs: Date.now() - startedAt,
      requests,
      averageResponseTimeMs: requests > 0 ? Math.round(totalResponseTime / requests) : 0,
      accepted: this.discoveryMetrics.queued,
      rejected: this.discoveryMetrics.ignored,
      invalidPages: 0,
      parserErrors: 0,
      qualityScore: 100,
      discoveryMetrics: this.discoveryMetrics,
    };
  }

  protected abstract listingUrls(): string[];

  protected async fetchWithRetry(url: string, conditionalHeaders?: { etag?: string; lastModified?: string }): Promise<RawResponseSnapshot> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const headers: Record<string, string> = {
          'User-Agent': this.config.userAgent,
          ...(this.config.headers ?? {}),
        };
        if (conditionalHeaders?.etag) headers['If-None-Match'] = conditionalHeaders.etag;
        if (conditionalHeaders?.lastModified) headers['If-Modified-Since'] = conditionalHeaders.lastModified;

        return await this.fetcher.fetch({
          url,
          timeoutMs: this.config.timeoutMs,
          headers,
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

  getQualityMetrics(): QualityMetrics {
    return { ...this.qualityMetrics };
  }

  // Discovery adapters don't need these methods
  async crawlDetails(): Promise<CrawlResult> {
    return { source: this.id, pages: 0, itemsFound: 0, newItems: 0, updatedItems: 0, duplicates: 0, failed: 0, durationMs: 0, requests: 0, averageResponseTimeMs: 0, accepted: 0, rejected: 0, invalidPages: 0, parserErrors: 0, qualityScore: 0 };
  }

  async parse(): Promise<unknown[]> { return []; }

  async normalize(): Promise<NewHackathon[]> { return []; }

  async validate(): Promise<unknown[]> { return []; }
}