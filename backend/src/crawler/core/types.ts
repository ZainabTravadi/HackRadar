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
  accepted?: number;
  rejected?: number;
  invalidPages?: number;
  parserErrors?: number;
  qualityScore?: number;
  qualityMetrics?: QualityMetrics;
  acceptanceRate?: number;
  rejectionRate?: number;
  discoveryMetrics?: {
    urlsFound: number;
    canonicalUrls: number;
    duplicates: number;
    queued: number;
    ignored: number;
  };
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

export type SourceClassification = 'PRIMARY' | 'AGGREGATOR' | 'DISCOVERY';
export type SourceMetadataQuality = 'full' | 'partial' | 'discovery';

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
  sourceClassification?: SourceClassification;
}

export interface SourceCapabilities {
  pagination: boolean;
  detailPages: boolean;
  metadataQuality: SourceMetadataQuality;
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
