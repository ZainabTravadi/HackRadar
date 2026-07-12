import axios from 'axios';
import { eq } from 'drizzle-orm';

import { db } from '../../../db';
import { hackathons } from '../../../db/schema';
import { normalize } from '../../../pipeline/normalizer';
import { BaseAdapter } from '../baseAdapter';
import { storeRawCrawl } from '../../core/rawCrawlStore';
import type { CrawlResult } from '../../core/types';
import { taikaiConfig } from './config';
import { parseTaikaiPayload } from './parser';

const TAIKAI_GRAPHQL_URL = 'https://api.taikai.network/api/graphql';
const TAIKAI_GRAPHQL_QUERY =
  'query ALL_CHALLENGES_QUERY($sortBy: ChallengeOrderByWithRelationInput, $searchTerm: String, $page: Int, $industries: [String!]) { challenges(where: {publishInfo: {state: {equals: ACTIVE}}, OR: [{name: {contains: $searchTerm, mode: insensitive}}, {slug: {contains: $searchTerm, mode: insensitive}}, {organization: {name: {contains: $searchTerm, mode: insensitive}}}], industries: {some: {title: {in: $industries}}}} page: $page orderBy: $sortBy) { id name isClosed shortDescription logoImageFile { id url __typename } cardImageFile { id url __typename } prize prizeDecimals prizeCurrency { id name __typename } organization { id name slug __typename } steps { id startDate __typename } currentStep { id name startDate __typename } industries { id title title_br title_es title_fr __typename } slug allowedParticipants participantsCount projectMembersCount projectsCount order isPublic publishInfo { id draftToken state __typename } __typename } challengesPageInfo(orderBy: $sortBy where: {publishInfo: {state: {equals: ACTIVE}}, OR: [{name: {contains: $searchTerm, mode: insensitive}}, {slug: {contains: $searchTerm, mode: insensitive}}, {organization: {name: {contains: $searchTerm, mode: insensitive}}}], industries: {some: {title: {in: $industries}}}}) { perPage pageCount recordCount __typename } }';

export class TaikaiAdapter extends BaseAdapter {
  public readonly id = taikaiConfig.id;
  public readonly name = taikaiConfig.name;

  constructor() {
    super({
      ...taikaiConfig,
      baseUrl: taikaiConfig.baseUrl,
      userAgent: taikaiConfig.userAgent,
      headers: taikaiConfig.headers,
    });
  }

  protected override listingUrls(): string[] {
    return [taikaiConfig.listingUrl];
  }

  protected override createRawHackathons(payload: unknown): ReturnType<BaseAdapter['createRawHackathons']> {
    if (typeof payload === 'string') {
      return parseTaikaiPayload(payload);
    }

    if (payload && typeof payload === 'object') {
      return parseTaikaiPayload(payload as Record<string, unknown>);
    }

    return [];
  }

  public override async crawlListings(): Promise<CrawlResult> {
    const startedAt = Date.now();
    let requests = 0;
    let pages = 0;
    let itemsFound = 0;
    let newItems = 0;
    let updatedItems = 0;
    let duplicates = 0;
    let failed = 0;
    let totalResponseTime = 0;

    const firstPage = await this.fetchPage(0);
    const firstPayload = firstPage.rawJson ? JSON.parse(firstPage.rawJson) : null;
    const pageCount = Math.max(1, Number(firstPayload?.data?.challengesPageInfo?.pageCount ?? 1));
    const pagesToProcess = Math.min(pageCount, this.config.maxPages ?? pageCount);
    const snapshots = [firstPage];

    for (let page = 1; page < pagesToProcess; page += 1) {
      snapshots.push(await this.fetchPage(page));
    }

    for (const snapshot of snapshots) {
      requests += 1;
      pages += 1;
      totalResponseTime += snapshot.responseTimeMs;
      this.rawResponses.push(snapshot);

      await storeRawCrawl({
        source: this.id,
        url: snapshot.url,
        html: snapshot.rawHtml ?? null,
        json: snapshot.rawJson ?? null,
        headers: snapshot.headers,
        statusCode: snapshot.statusCode,
        responseTimeMs: snapshot.responseTimeMs,
        timestamp: snapshot.timestamp,
      });

      const payload = snapshot.rawJson ? JSON.parse(snapshot.rawJson) : snapshot.rawHtml ?? '';
      const parsed = this.createRawHackathons(payload);
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

      await this.delay(this.config.delayMs);
    }

    const accepted = newItems + updatedItems;
    const rejected = failed;
    const qualityScore = itemsFound > 0 ? Math.round((accepted / Math.max(1, itemsFound)) * 100) : 0;

    console.info(`[${this.name}] quality accepted=${accepted} rejected=${rejected} duplicates=${duplicates} invalidPages=0 parserErrors=0 score=${qualityScore}%`);

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

  private async fetchPage(page: number): Promise<{
    url: string;
    method: string;
    statusCode: number;
    responseTimeMs: number;
    timestamp: string;
    headers: Record<string, string>;
    rawHtml?: string;
    rawJson?: string;
  }> {
    const startedAt = Date.now();
    const response = await axios.request({
      method: 'POST',
      url: TAIKAI_GRAPHQL_URL,
      timeout: this.config.timeoutMs,
      headers: {
        'User-Agent': this.config.userAgent,
        'Content-Type': 'application/json',
        Accept: 'application/json,text/plain,*/*',
      },
      data: {
        operationName: 'ALL_CHALLENGES_QUERY',
        variables: {
          sortBy: { order: 'desc' },
          searchTerm: '%%',
          page,
        },
        query: TAIKAI_GRAPHQL_QUERY,
      },
      validateStatus: () => true,
    });

    const elapsed = Date.now() - startedAt;
    const headers = Object.fromEntries(Object.entries(response.headers ?? {}).map(([key, value]) => [key, String(value)]));

    return {
      url: response.config.url ?? TAIKAI_GRAPHQL_URL,
      method: 'POST',
      statusCode: response.status,
      responseTimeMs: elapsed,
      timestamp: new Date().toISOString(),
      headers,
      rawJson: typeof response.data === 'object' ? JSON.stringify(response.data) : undefined,
      rawHtml: typeof response.data === 'string' ? response.data : undefined,
    };
  }
}
