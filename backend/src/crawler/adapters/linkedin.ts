import { BaseAdapter } from './baseAdapter';
import { collectDiscoveryMetrics, type DiscoveryMetrics } from '../core/discoveryQueue';

export class LinkedInAdapter extends BaseAdapter {
  public readonly id = 'linkedin';
  public readonly name = 'LinkedIn Events';
  public discoveryMetrics: DiscoveryMetrics = { urlsFound: 0, canonicalUrls: 0, duplicates: 0, queued: 0, ignored: 0 };

  constructor() {
    super({
      id: 'linkedin',
      name: 'LinkedIn Events',
      baseUrl: 'https://www.linkedin.com',
      delayMs: 1000,
      concurrency: 1,
      retryAfterMs: 1500,
      timeoutMs: 20_000,
      enableProxy: false,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      headers: { Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' },
      maxPages: 3,
      detailPageLimit: 25,
      crawlType: 'html',
      sourceType: 'generic',
    });
  }

  protected override listingUrls(): string[] {
    return ['https://www.linkedin.com/events/'];
  }

  protected override createRawHackathons(payload: unknown): ReturnType<BaseAdapter['createRawHackathons']> {
    if (typeof payload === 'string') {
      return [];
    }

    return [];
  }

  protected override async fetchWithRetry(url: string): Promise<any> {
    const response = await super.fetchWithRetry(url);
    if (typeof response.rawHtml === 'string') {
      this.discoveryMetrics = await collectDiscoveryMetrics(response.rawHtml, response.url, this.id);
    }
    return response;
  }
}
