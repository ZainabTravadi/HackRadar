import { eq } from 'drizzle-orm';

import { db } from '../../db';
import { hackathons } from '../../db/schema';
import { normalize, type RawHackathon } from '../../pipeline/normalizer';
import { Deduplicator } from '../core/deduplicator';
import { Fetcher } from '../core/fetcher';
import { Parser, type AdapterUrlPatterns } from '../core/parser';
import { Validator, type EvidenceScore } from '../core/validator';
import { classifyPage, isEventPage, type ClassificationResult } from '../core/pageClassifier';
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
  rejectedCanonicalUrl: number;
  rejectedExpiredEvent: number;
  rejectedHtmlArtifacts: number;
  acceptedEvents: number;
  // Page classification tracking
  pageClassifications: Record<string, number>;
}

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
  protected qualityMetrics: QualityMetrics = this.initQualityMetrics();

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
      rejectedCanonicalUrl: 0,
      rejectedExpiredEvent: 0,
      rejectedHtmlArtifacts: 0,
      acceptedEvents: 0,
      pageClassifications: {},
    };
  }

  async crawlListings(): Promise<CrawlResult> {
    const startedAt = Date.now();
    this.qualityMetrics = this.initQualityMetrics();
    let requests = 0;
    let pages = 0;
    let itemsFound = 0;
    let newItems = 0;
    let updatedItems = 0;
    let duplicates = 0;
    let failed = 0;
    let invalidPages = 0;
    let parserErrors = 0;
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
        this.qualityMetrics.linksDiscovered += parsed.length;

        for (const item of parsed) {
          this.qualityMetrics.candidateEvents += 1;

          const isDuplicate = await this.deduplicator.isDuplicate(this.id, item.sourceId, item.sourceUrl);
          if (isDuplicate) {
            duplicates += 1;
            this.qualityMetrics.rejectedDuplicates += 1;
            continue;
          }

          const validationIssues = this.validator.validate(item);
          if (validationIssues.length > 0) {
            failed += 1;
            for (const issue of validationIssues) {
              this.categorizeRejection(issue.reason);
            }
            invalidPages += validationIssues.filter((issue) =>
              issue.reason.includes('page') ||
              issue.reason.includes('asset') ||
              issue.reason.includes('evidence')
            ).length;
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
          this.qualityMetrics.acceptedEvents += 1;
        }
      } catch (error: unknown) {
        failed += 1;
        parserErrors += 1;
        console.error(`[${this.name}] listing fetch failed for ${url}: ${this.formatError(error)}`);
      }

      await this.delay(this.config.delayMs);
    }

    this.qualityMetrics.pagesFetched = pages;

    const accepted = newItems + updatedItems + duplicates;
    const rejected = failed + invalidPages;
    const qualityScore = itemsFound > 0 ? Math.round((accepted / Math.max(1, itemsFound)) * 100) : 0;

    const acceptanceRate = this.qualityMetrics.candidateEvents > 0
      ? Math.round((this.qualityMetrics.acceptedEvents / this.qualityMetrics.candidateEvents) * 100)
      : 0;
    const rejectionRate = this.qualityMetrics.candidateEvents > 0
      ? Math.round(((this.qualityMetrics.candidateEvents - this.qualityMetrics.acceptedEvents) / this.qualityMetrics.candidateEvents) * 100)
      : 0;

    console.info(
      `[${this.name}] quality accepted=${accepted} rejected=${rejected} duplicates=${duplicates} invalidPages=${invalidPages} parserErrors=${parserErrors} score=${qualityScore}% ` +
      `acceptanceRate=${acceptanceRate}% rejectionRate=${rejectionRate}% ` +
      `pagesFetched=${this.qualityMetrics.pagesFetched} linksDiscovered=${this.qualityMetrics.linksDiscovered} candidates=${this.qualityMetrics.candidateEvents} ` +
      `rejected: nav=${this.qualityMetrics.rejectedNavigationLinks} assets=${this.qualityMetrics.rejectedAssets} dup=${this.qualityMetrics.rejectedDuplicates} ` +
      `invalid=${this.qualityMetrics.rejectedInvalidPages} dates=${this.qualityMetrics.rejectedMalformedDates} evidence=${this.qualityMetrics.rejectedInsufficientEvidence} ` +
      `blockedTitle=${this.qualityMetrics.rejectedBlockedTitles} blockedUrl=${this.qualityMetrics.rejectedBlockedUrls} blockedExt=${this.qualityMetrics.rejectedBlockedExtensions} ` +
      `canonical=${this.qualityMetrics.rejectedCanonicalUrl} expired=${this.qualityMetrics.rejectedExpiredEvent} htmlArtifacts=${this.qualityMetrics.rejectedHtmlArtifacts} ` +
      `pageClassifications=${JSON.stringify(this.qualityMetrics.pageClassifications)}`
    );

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
      accepted,
      rejected,
      invalidPages,
      parserErrors,
      qualityScore,
    };
  }

  private categorizeRejection(reason: string): void {
    const r = reason.toLowerCase();
    if (r.includes('navigation') || r.includes('category') || r.includes('listing')) {
      this.qualityMetrics.rejectedNavigationLinks += 1;
    } else if (r.includes('asset') || r.includes('api') || r.includes('static') || r.includes('image')) {
      this.qualityMetrics.rejectedAssets += 1;
    } else if (r.includes('invalid') || r.includes('page') || r.includes('evidence')) {
      this.qualityMetrics.rejectedInvalidPages += 1;
    } else if (r.includes('date') || r.includes('malformed')) {
      this.qualityMetrics.rejectedMalformedDates += 1;
    } else if (r.includes('insufficient') || r.includes('evidence')) {
      this.qualityMetrics.rejectedInsufficientEvidence += 1;
    } else if (r.includes('blocked') && r.includes('title')) {
      this.qualityMetrics.rejectedBlockedTitles += 1;
    } else if (r.includes('blocked') && r.includes('url')) {
      this.qualityMetrics.rejectedBlockedUrls += 1;
    } else if (r.includes('blocked') && r.includes('extension')) {
      this.qualityMetrics.rejectedBlockedExtensions += 1;
    } else if (r.includes('canonical') || r.includes('non-canonical')) {
      this.qualityMetrics.rejectedCanonicalUrl += 1;
    } else if (r.includes('expired') || r.includes('ended')) {
      this.qualityMetrics.rejectedExpiredEvent += 1;
    } else if (r.includes('html') || r.includes('artifact') || r.includes('<span') || r.includes('<div') || r.includes('&nbsp;') || r.includes('&') || r.includes('<') || r.includes('>')) {
      this.qualityMetrics.rejectedHtmlArtifacts += 1;
    }
  }

  async crawlListingsIncremental(): Promise<CrawlResult> {
    const state = await crawlStateService.getState(this.id);
    const conditionalHeaders = state ? { etag: state.etag, lastModified: state.lastModified?.toISOString() } : undefined;

    const startedAt = Date.now();
    this.qualityMetrics = this.initQualityMetrics();
    let requests = 0;
    let pages = 0;
    let itemsFound = 0;
    let newItems = 0;
    let updatedItems = 0;
    let duplicates = 0;
    let failed = 0;
    let invalidPages = 0;
    let parserErrors = 0;
    let totalResponseTime = 0;
    let skippedUnchanged = 0;

    for (const url of this.listingUrls()) {
      try {
        const response = await this.fetchWithRetry(url, conditionalHeaders);
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

        if (response.statusCode === 304) {
          skippedUnchanged += 1;
          continue;
        }

        const parsed = this.parseResponse(response);
        this.parsedItems.push(...parsed);
        itemsFound += parsed.length;
        this.qualityMetrics.linksDiscovered += parsed.length;

        for (const item of parsed) {
          this.qualityMetrics.candidateEvents += 1;

          const isDuplicate = await this.deduplicator.isDuplicate(this.id, item.sourceId, item.sourceUrl);
          if (isDuplicate) {
            duplicates += 1;
            this.qualityMetrics.rejectedDuplicates += 1;
            continue;
          }

          const validationIssues = this.validator.validate(item);
          if (validationIssues.length > 0) {
            failed += 1;
            for (const issue of validationIssues) {
              this.categorizeRejection(issue.reason);
            }
            invalidPages += validationIssues.filter((issue) =>
              issue.reason.includes('page') || issue.reason.includes('asset') || issue.reason.includes('evidence')
            ).length;
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
          this.qualityMetrics.acceptedEvents += 1;
        }
      } catch (error: unknown) {
        failed += 1;
        parserErrors += 1;
        console.error(`[${this.name}] listing fetch failed for ${url}: ${this.formatError(error)}`);
      }

      await this.delay(this.config.delayMs);
    }

    this.qualityMetrics.pagesFetched = pages;

    const accepted = newItems + updatedItems + duplicates;
    const rejected = failed + invalidPages;
    const qualityScore = itemsFound > 0 ? Math.round((accepted / Math.max(1, itemsFound)) * 100) : 0;

    const acceptanceRate = this.qualityMetrics.candidateEvents > 0
      ? Math.round((this.qualityMetrics.acceptedEvents / this.qualityMetrics.candidateEvents) * 100)
      : 0;
    const rejectionRate = this.qualityMetrics.candidateEvents > 0
      ? Math.round(((this.qualityMetrics.candidateEvents - this.qualityMetrics.acceptedEvents) / this.qualityMetrics.candidateEvents) * 100)
      : 0;

    console.info(
      `[${this.name}] incremental quality accepted=${accepted} rejected=${rejected} duplicates=${duplicates} invalidPages=${invalidPages} parserErrors=${parserErrors} skippedUnchanged=${skippedUnchanged} score=${qualityScore}% ` +
      `acceptanceRate=${acceptanceRate}% rejectionRate=${rejectionRate}% ` +
      `pagesFetched=${this.qualityMetrics.pagesFetched} linksDiscovered=${this.qualityMetrics.linksDiscovered} candidates=${this.qualityMetrics.candidateEvents} ` +
      `rejected: nav=${this.qualityMetrics.rejectedNavigationLinks} assets=${this.qualityMetrics.rejectedAssets} dup=${this.qualityMetrics.rejectedDuplicates} ` +
      `invalid=${this.qualityMetrics.rejectedInvalidPages} dates=${this.qualityMetrics.rejectedMalformedDates} evidence=${this.qualityMetrics.rejectedInsufficientEvidence} ` +
      `blockedTitle=${this.qualityMetrics.rejectedBlockedTitles} blockedUrl=${this.qualityMetrics.rejectedBlockedUrls} blockedExt=${this.qualityMetrics.rejectedBlockedExtensions} ` +
      `canonical=${this.qualityMetrics.rejectedCanonicalUrl} expired=${this.qualityMetrics.rejectedExpiredEvent} htmlArtifacts=${this.qualityMetrics.rejectedHtmlArtifacts} ` +
      `pageClassifications=${JSON.stringify(this.qualityMetrics.pageClassifications)}`
    );

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
      accepted,
      rejected,
      invalidPages,
      parserErrors,
      qualityScore,
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

    const accepted = newItems + updatedItems + duplicates;
    const rejected = failed;
    const qualityScore = itemsFound > 0 ? Math.round((accepted / Math.max(1, itemsFound)) * 100) : 0;

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
      accepted,
      rejected,
      invalidPages: 0,
      parserErrors: 0,
      qualityScore,
    };
  }

  async parse(): Promise<unknown[]> {
    return this.parsedItems;
  }

  async normalize(): Promise<NewHackathon[]> {
    this.normalizedItems = [];
    for (const item of this.parsedItems) {
      const isDuplicate = await this.deduplicator.isDuplicate(this.id, item.sourceId, item.sourceUrl);
      if (isDuplicate) {
        continue;
      }

      const validationIssues = this.validator.validate(item);
      if (validationIssues.length > 0) {
        continue;
      }

      this.normalizedItems.push(normalize(item));
    }

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
    // Classify the page first - only parse EVENT pages
    if (snapshot.rawHtml) {
      const classification = classifyPage(snapshot.rawHtml, snapshot.url);
      
      this.qualityMetrics.pagesFetched += 1;
      this.qualityMetrics.pageClassifications[classification.classification] = 
        (this.qualityMetrics.pageClassifications[classification.classification] || 0) + 1;
      
      // Track page classification metrics
      if (!isEventPage(classification)) {
        console.info(`[${this.name}] Page classified as ${classification.classification} (confidence: ${classification.confidence}), skipping parse: ${snapshot.url}`);
        this.categorizePageClassification(classification.classification);
        return [];
      }
      
      console.info(`[${this.name}] Page classified as EVENT (confidence: ${classification.confidence}), proceeding with parse: ${snapshot.url}`);
    }

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

  private categorizePageClassification(classification: string): void {
    const c = classification.toLowerCase();
    if (c.includes('category') || c.includes('listing')) {
      this.qualityMetrics.rejectedNavigationLinks += 1;
    } else if (c.includes('asset') || c.includes('social')) {
      this.qualityMetrics.rejectedAssets += 1;
    } else if (c.includes('navigation') || c.includes('login') || c.includes('help') || c.includes('pricing') || c.includes('blog') || c.includes('documentation') || c.includes('search') || c.includes('profile') || c.includes('landing')) {
      this.qualityMetrics.rejectedInvalidPages += 1;
    }
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
}