import { BaseAdapter } from '../baseAdapter';
import { devfolioConfig } from './config';
import { parseDevfolioPayload } from './parser';

export class DevfolioAdapter extends BaseAdapter {
  public readonly id = devfolioConfig.id;
  public readonly name = devfolioConfig.name;

  constructor() {
    super({
      ...devfolioConfig,
      baseUrl: devfolioConfig.baseUrl,
      userAgent: devfolioConfig.userAgent,
      headers: devfolioConfig.headers,
    });
  }

  protected override listingUrls(): string[] {
    return [devfolioConfig.listingUrl];
  }

  protected override createRawHackathons(payload: unknown): ReturnType<BaseAdapter['createRawHackathons']> {
    if (typeof payload === 'string') {
      return parseDevfolioPayload(payload);
    }

    return [];
  }
}
