import { BaseAdapter } from '../baseAdapter';
import { hackerearthConfig } from './config';
import { parseHackerEarthPayload } from './parser';

export class HackerEarthAdapter extends BaseAdapter {
  public readonly id = hackerearthConfig.id;
  public readonly name = hackerearthConfig.name;

  constructor() {
    super({
      ...hackerearthConfig,
      baseUrl: hackerearthConfig.baseUrl,
      userAgent: hackerearthConfig.userAgent,
      headers: hackerearthConfig.headers,
    });
  }

  protected override listingUrls(): string[] {
    return [hackerearthConfig.listingUrl];
  }

  protected override createRawHackathons(payload: unknown): ReturnType<BaseAdapter['createRawHackathons']> {
    if (typeof payload === 'string') {
      return parseHackerEarthPayload(payload);
    }

    return [];
  }
}
