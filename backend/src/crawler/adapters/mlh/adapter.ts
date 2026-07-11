import { BaseAdapter } from '../baseAdapter';
import { mlhConfig } from './config';
import { parseMlhPayload } from './parser';

export class MlhAdapter extends BaseAdapter {
  public readonly id = mlhConfig.id;
  public readonly name = mlhConfig.name;

  constructor() {
    super({
      ...mlhConfig,
      baseUrl: mlhConfig.baseUrl,
      userAgent: mlhConfig.userAgent,
      headers: mlhConfig.headers,
    });
  }

  protected override listingUrls(): string[] {
    return [mlhConfig.listingUrl];
  }

  protected override createRawHackathons(payload: unknown): ReturnType<BaseAdapter['createRawHackathons']> {
    if (typeof payload === 'string') {
      return parseMlhPayload(payload);
    }

    return [];
  }
}
