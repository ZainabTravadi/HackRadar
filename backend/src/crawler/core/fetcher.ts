import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios';

import type { RawResponseSnapshot } from './types';

export interface FetchOptions {
  url: string;
  method?: 'GET' | 'POST' | 'HEAD';
  headers?: Record<string, string>;
  timeoutMs?: number;
  etag?: string;
  lastModified?: string;
}

export interface ConditionalFetchResult {
  snapshot: RawResponseSnapshot;
  notModified: boolean;
}

export class Fetcher {
  async fetch(options: FetchOptions): Promise<RawResponseSnapshot> {
    const startedAt = Date.now();
    const config: AxiosRequestConfig = {
      method: options.method ?? 'GET',
      url: options.url,
      headers: options.headers,
      timeout: options.timeoutMs ?? 15_000,
      validateStatus: () => true,
    };

    const response = await axios.request(config);
    const elapsed = Date.now() - startedAt;
    const headers = Object.fromEntries(Object.entries(response.headers ?? {}).map(([key, value]) => [key, String(value)]));

    return {
      url: response.config.url ?? options.url,
      method: config.method?.toUpperCase() ?? 'GET',
      statusCode: response.status,
      responseTimeMs: elapsed,
      timestamp: new Date().toISOString(),
      headers,
      rawHtml: typeof response.data === 'string' ? response.data : undefined,
      rawJson: typeof response.data === 'object' ? JSON.stringify(response.data) : undefined,
    };
  }

  async fetchConditional(options: FetchOptions): Promise<ConditionalFetchResult> {
    const headers = { ...options.headers };
    if (options.etag) headers['If-None-Match'] = options.etag;
    if (options.lastModified) headers['If-Modified-Since'] = options.lastModified;

    const snapshot = await this.fetch({ ...options, headers });
    return { snapshot, notModified: snapshot.statusCode === 304 };
  }
}
