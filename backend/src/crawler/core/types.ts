import type { NewHackathon } from '../../db/schema';

export interface CrawlResult {
  source: string;
  pages: number;
  itemsFound: number;
  newItems: number;
  updatedItems: number;
  duplicates: number;
  failed: number;
  durationMs: number;
  requests: number;
  averageResponseTimeMs: number;
}

export interface RawResponseSnapshot {
  url: string;
  method: string;
  statusCode: number;
  responseTimeMs: number;
  timestamp: string;
  headers: Record<string, string>;
  rawHtml?: string;
  rawJson?: string;
}

export interface SourceAdapter {
  id: string;
  name: string;
  crawlListings(): Promise<CrawlResult>;
  crawlDetails(): Promise<CrawlResult>;
  parse(): Promise<unknown[]>;
  normalize(): Promise<NewHackathon[]>;
  validate(): Promise<unknown[]>;
}

export interface AdapterConfig {
  id: string;
  name: string;
  baseUrl: string;
  delayMs: number;
  concurrency: number;
  retryAfterMs: number;
  timeoutMs: number;
  enableProxy: boolean;
  userAgent: string;
  headers?: Record<string, string>;
  maxPages?: number;
  detailPageLimit?: number;
  crawlType?: 'html' | 'json' | 'rss' | 'sitemap';
  sourceType?: 'generic' | 'devpost' | 'mlh';
}

export type SourceKind =
  | 'devpost'
  | 'mlh'
  | 'devfolio'
  | 'unstop'
  | 'dorahacks'
  | 'taikai'
  | 'hackerearth'
  | 'hack2skill'
  | 'reskilll'
  | 'lablab'
  | 'ethglobal'
  | 'angelhack'
  | 'hackclub'
  | 'university'
  | 'eventbrite'
  | 'luma'
  | 'meetup'
  | 'github'
  | 'reddit'
  | 'discord'
  | 'telegram'
  | 'linkedin'
  | 'twitter'
  | 'facebook'
  | 'google';
