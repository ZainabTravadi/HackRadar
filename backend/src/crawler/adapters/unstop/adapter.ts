import { BaseAdapter } from '../baseAdapter';
import { unstopConfig } from './config';
import { parseUnstopPayload } from './parser';

export class UnstopAdapter extends BaseAdapter {
  public readonly id = unstopConfig.id;
  public readonly name = unstopConfig.name;

  constructor() {
    super({
      ...unstopConfig,
      baseUrl: unstopConfig.baseUrl,
      userAgent: unstopConfig.userAgent,
      headers: unstopConfig.headers,
    });
  }

  protected override listingUrls(): string[] {
    return ['https://unstop.com/api/public/opportunity/search-result?opportunity=hackathons&page=1&per_page=18&oppstatus=open&sortBy=&orderBy=&filter_condition=&undefined=true'];
  }

  protected override createRawHackathons(payload: unknown): ReturnType<BaseAdapter['createRawHackathons']> {
    if (payload && typeof payload === 'object') {
      return parseUnstopPayload(payload);
    }

    if (typeof payload === 'string') {
      return parseUnstopPayload(payload);
    }

    return [];
  }
}
