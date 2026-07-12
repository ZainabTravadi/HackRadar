import { BaseAdapter } from './baseAdapter';
import { parseGenericListingHtml } from './genericEventParser';

export class LumaAdapter extends BaseAdapter {
  public readonly id = 'luma';
  public readonly name = 'Luma';

  constructor() {
    super({
      id: 'luma',
      name: 'Luma',
      baseUrl: 'https://lu.ma',
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
    return ['https://lu.ma/discover'];
  }

  protected override createRawHackathons(payload: unknown): ReturnType<BaseAdapter['createRawHackathons']> {
    return parseGenericListingHtml(payload, 'luma', {
      baseUrl: 'https://lu.ma',
      sourceName: 'Luma',
      urlPatterns: [/lu\.ma\/[a-z0-9-]+$/i],
      rejectPatterns: [
        /lu\.ma\/discover/i,
        /lu\.ma\/communities/i,
        /lu\.ma\/creators/i,
        /lu\.ma\/pricing/i,
        /lu\.ma\/app/i,
        /lu\.ma\/city\//i,
        /lu\.ma\/search/i,
        /lu\.ma\/explore/i,
        /lu\.ma\/calendar/i,
        /lu\.ma\/organize/i,
        /lu\.ma\/create/i,
        /lu\.ma\/help/i,
        /lu\.ma\/about/i,
        /lu\.ma\/blog/i,
        /lu\.ma\/careers/i,
        /lu\.ma\/press/i,
        /lu\.ma\/privacy/i,
        /lu\.ma\/terms/i,
        /lu\.ma\/cookies/i,
        /lu\.ma\/guidelines/i,
        /lu\.ma\/safety/i,
        /lu\.ma\/api/i,
        /lu\.ma\/developers/i,
        /lu\.ma\/partners/i,
        /lu\.ma\/affiliates/i,
        /lu\.ma\/referral/i,
        /lu\.ma\/login/i,
        /lu\.ma\/signup/i,
        /lu\.ma\/signin/i,
        /lu\.ma\/logout/i,
        /lu\.ma\/settings/i,
        /lu\.ma\/profile/i,
        /lu\.ma\/notifications/i,
        /lu\.ma\/messages/i,
        /lu\.ma\/saved/i,
        /lu\.ma\/history/i,
        /lu\.ma\/activity/i,
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
      ],
      maxItems: 12,
    });
  }
}