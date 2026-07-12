import { DiscoveryAdapter } from './discoveryAdapter';
import type { NewHackathon } from '../../db/schema';

export class GitHubEventsAdapter extends DiscoveryAdapter {
  public readonly id = 'github';
  public readonly name = 'GitHub Events';

  constructor() {
    super({
      id: 'github',
      name: 'GitHub Events',
      baseUrl: 'https://github.com',
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
    return ['https://github.com/events'];
  }

  async normalize(): Promise<NewHackathon[]> {
    return [];
  }
}