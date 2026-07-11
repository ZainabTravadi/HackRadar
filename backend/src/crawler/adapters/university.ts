import * as cheerio from 'cheerio';

import { BaseAdapter } from './baseAdapter';

const UNIVERSITY_EVENTS = {
  qatar: {
    title: 'Precision Health AI Hackathon - Qatar',
    sourceUrl: 'https://hackathon.cornell.edu/qatar',
  },
  food: {
    title: 'Food Hackathon',
    sourceUrl: 'https://hackathon.cornell.edu/food',
  },
  ai: {
    title: 'AI Hackathon',
    sourceUrl: 'https://hackathon.cornell.edu/ai',
  },
  digitalag: {
    title: 'Digital Agriculture Hackathon',
    sourceUrl: 'https://hackathon.cornell.edu/digitalag',
  },
  animalhealth: {
    title: 'Animal Health Hackathon',
    sourceUrl: 'https://hackathon.cornell.edu/animalhealth',
  },
  health: {
    title: 'AI Health Hackathon',
    sourceUrl: 'https://hackathon.cornell.edu/health',
  },
} as const;

export class UniversityAdapter extends BaseAdapter {
  public readonly id = 'university';
  public readonly name = 'Major University Hackathons';

  constructor() {
    super({
      id: 'university',
      name: 'Major University Hackathons',
      baseUrl: 'https://hackathon.cornell.edu',
      delayMs: 1000,
      concurrency: 1,
      retryAfterMs: 1500,
      timeoutMs: 20_000,
      enableProxy: false,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      headers: { Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' },
      maxPages: 2,
      detailPageLimit: 10,
      crawlType: 'html',
      sourceType: 'generic',
    });
  }

  protected override listingUrls(): string[] {
    return ['https://hackathon.cornell.edu/'];
  }

  protected override detailUrls(): string[] {
    return Object.values(UNIVERSITY_EVENTS).map((event) => event.sourceUrl);
  }

  protected override createRawHackathons(payload: unknown): ReturnType<BaseAdapter['createRawHackathons']> {
    if (typeof payload !== 'string') {
      return [];
    }

    const $ = cheerio.load(payload);
    const canonical = $('link[rel="canonical"]').attr('href')?.trim() || '';
    const ogTitle = $('meta[property="og:title"]').attr('content')?.trim() || '';
    const ogDescription = $('meta[property="og:description"]').attr('content')?.trim() || '';
    const ogImage = $('meta[property="og:image"]').attr('content')?.trim() || undefined;
    const detailMatch = Object.values(UNIVERSITY_EVENTS).find((event) => canonical === event.sourceUrl || ogTitle === event.title || ogTitle.startsWith('Cornell University '));

    if (detailMatch) {
      return [
        {
          title: ogTitle || detailMatch.title,
          description: ogDescription || $('body').text().replace(/\s+/g, ' ').trim().slice(0, 500),
          sourceUrl: canonical || detailMatch.sourceUrl,
          sourceId: canonical || detailMatch.sourceUrl,
          source: 'university',
          imageUrl: ogImage,
          rawData: {
            html: payload.slice(0, 3000),
            title: ogTitle || detailMatch.title,
            sourceUrl: canonical || detailMatch.sourceUrl,
          },
        },
      ];
    }

    const items: ReturnType<BaseAdapter['createRawHackathons']> = [];
    const seen = new Set<string>();

    $('img[alt]').each((_, element) => {
      const image = $(element);
      const alt = image.attr('alt')?.trim() || '';
      const match = alt.match(/^(Qatar|Food|Ai|DigAg|Digital Ag|Animal|Health|AI Health)\s+'(\d{2})$/i);
      if (!match) {
        return;
      }

      const key = normalizeKey(match[1]);
      const event = UNIVERSITY_EVENTS[key];
      if (!event || seen.has(event.sourceUrl)) {
        return;
      }

      const item = image.closest('.wixui-repeater__item');
      const description = item.find('p').first().text().trim().replace(/\s+/g, ' ');
      const dateText = item.find('h6').first().text().trim().replace(/\s+/g, ' ');
      const locationText = item.find('p').last().text().trim().replace(/\s+/g, ' ');
      const dates = parseDateRange(dateText);

      seen.add(event.sourceUrl);
      items.push({
        title: event.title,
        description: description || event.title,
        sourceUrl: event.sourceUrl,
        sourceId: event.sourceUrl,
        source: 'university',
        imageUrl: image.attr('src')?.trim() || image.attr('data-src')?.trim() || undefined,
        startDate: dates?.startDate,
        endDate: dates?.endDate,
        locationText: locationText || undefined,
        rawData: {
          html: payload.slice(0, 3000),
          title: event.title,
          sourceUrl: event.sourceUrl,
        },
      });
    });

    return items;
  }
}

function normalizeKey(value: string): keyof typeof UNIVERSITY_EVENTS {
  const normalized = value.toLowerCase().replace(/\s+/g, '');
  if (normalized === 'qatar') {
    return 'qatar';
  }
  if (normalized === 'food') {
    return 'food';
  }
  if (normalized === 'ai') {
    return 'ai';
  }
  if (normalized === 'digitalag') {
    return 'digitalag';
  }
  if (normalized === 'digag') {
    return 'digitalag';
  }
  if (normalized === 'animal') {
    return 'animalhealth';
  }
  return 'health';
}

function parseDateRange(value: string): { startDate?: Date; endDate?: Date } {
  const compact = value.replace(/\s+/g, ' ').trim();
  const match = compact.match(/^([A-Za-z]+)\s+(\d{1,2})(?:-([A-Za-z]+)?\s*(\d{1,2}))?,\s*(\d{4})$/);
  if (!match) {
    return {};
  }

  const [, startMonth, startDay, endMonthRaw, endDayRaw, year] = match;
  const endMonth = endMonthRaw || startMonth;
  const endDay = endDayRaw || startDay;
  const startDate = new Date(`${startMonth} ${startDay}, ${year}`);
  const endDate = new Date(`${endMonth} ${endDay}, ${year}`);

  return {
    startDate: Number.isNaN(startDate.getTime()) ? undefined : startDate,
    endDate: Number.isNaN(endDate.getTime()) ? undefined : endDate,
  };
}
