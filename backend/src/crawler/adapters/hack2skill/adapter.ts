import { BaseAdapter } from '../baseAdapter';
import { hack2skillConfig } from './config';
import { parseHack2SkillPayload } from './parser';

export class Hack2SkillAdapter extends BaseAdapter {
  public readonly id = hack2skillConfig.id;
  public readonly name = hack2skillConfig.name;

  constructor() {
    super({
      ...hack2skillConfig,
      baseUrl: hack2skillConfig.baseUrl,
      userAgent: hack2skillConfig.userAgent,
      headers: hack2skillConfig.headers,
    });
  }

  protected override listingUrls(): string[] {
    return this.buildPaginatedUrls(hack2skillConfig.listingUrl, 'page');
  }

  protected override createRawHackathons(payload: unknown): ReturnType<BaseAdapter['createRawHackathons']> {
    if (typeof payload === 'string') {
      return parseHack2SkillPayload(payload);
    }

    if (payload && typeof payload === 'object') {
      return parseHack2SkillPayload(payload as Record<string, unknown>);
    }

    return [];
  }
}
