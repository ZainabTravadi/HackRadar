import { BaseAdapter } from './baseAdapter';
import { parseGenericListingHtml } from './genericEventParser';

export class EventbriteAdapter extends BaseAdapter {
  public readonly id = 'eventbrite';
  public readonly name = 'Eventbrite';

  constructor() {
    super({
      id: 'eventbrite',
      name: 'Eventbrite',
      baseUrl: 'https://www.eventbrite.com',
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
    return ['https://www.eventbrite.com/d/online/hackathon/'];
  }

  protected override createRawHackathons(payload: unknown): ReturnType<BaseAdapter['createRawHackathons']> {
    return parseGenericListingHtml(payload, 'eventbrite', {
      baseUrl: 'https://www.eventbrite.com',
      sourceName: 'Eventbrite',
      urlPatterns: [/eventbrite\.com\/e\/[^/]+/i],
      rejectPatterns: [
        /eventbrite\.com\/d\//i,
        /eventbrite\.com\/pricing/i,
        /eventbrite\.com\/contact/i,
        /eventbrite\.com\/community/i,
        /eventbrite\.com\/help/i,
        /eventbrite\.com\/blog/i,
        /eventbrite\.com\/news/i,
        /eventbrite\.com\/find/i,
        /eventbrite\.com\/qr/i,
        /eventbrite\.com\/assets/i,
        /eventbrite\.com\/static/i,
        /eventbrite\.com\/about/i,
        /eventbrite\.com\/careers/i,
        /eventbrite\.com\/press/i,
        /eventbrite\.com\/privacy/i,
        /eventbrite\.com\/terms/i,
        /eventbrite\.com\/cookies/i,
        /eventbrite\.com\/accessibility/i,
        /eventbrite\.com\/sitemap/i,
        /facebook\.com/i,
        /instagram\.com/i,
        /tiktok\.com/i,
        /twitter\.com/i,
        /linkedin\.com/i,
        /youtube\.com/i,
        /\.svg$/i,
        /\.png$/i,
        /\.jpg$/i,
        /\.jpeg$/i,
        /\.gif$/i,
        /\.webp$/i,
        /\.js$/i,
        /\.css$/i,
        /\/assets\//i,
        /\/static\//i,
        /\/images\//i,
        /\/img\//i,
      ],
      maxItems: 12,
    });
  }
}