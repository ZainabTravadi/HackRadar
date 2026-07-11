import { BaseAdapter } from '../baseAdapter';
import { dorahacksConfig } from './config';
import { parseDoraHacksPayload } from './parser';

export class DoraHacksAdapter extends BaseAdapter {
  public readonly id = dorahacksConfig.id;
  public readonly name = dorahacksConfig.name;

  constructor() {
    super({
      ...dorahacksConfig,
      baseUrl: dorahacksConfig.baseUrl,
      userAgent: dorahacksConfig.userAgent,
      headers: dorahacksConfig.headers,
    });
  }

  protected override listingUrls(): string[] {
    return [dorahacksConfig.listingUrl];
  }

  protected override createRawHackathons(payload: unknown): ReturnType<BaseAdapter['createRawHackathons']> {
    if (typeof payload === 'string') {
      return parseDoraHacksPayload(payload);
    }

    return [];
  }
}
