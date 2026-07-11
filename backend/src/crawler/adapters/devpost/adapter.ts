import { BaseAdapter } from '../baseAdapter';
import { devpostConfig } from './config';
import { parseDevpostPayload } from './parser';

export class DevpostAdapter extends BaseAdapter {
  public readonly id = devpostConfig.id;
  public readonly name = devpostConfig.name;

  constructor() {
    super({
      ...devpostConfig,
      baseUrl: devpostConfig.baseUrl,
      userAgent: devpostConfig.userAgent,
      headers: devpostConfig.headers,
    });
  }

  protected override listingUrls(): string[] {
    return [devpostConfig.listingUrl];
  }

  protected override detailUrls(): string[] {
    return [];
  }

  protected override createRawHackathons(payload: unknown): ReturnType<BaseAdapter['createRawHackathons']> {
    if (payload && typeof payload === 'object' && Array.isArray((payload as Record<string, unknown>).hackathons)) {
      return parseDevpostPayload(payload);
    }

    return [];
  }
}
