import 'dotenv/config';
import { eq, sql } from 'drizzle-orm';

import { db } from '../db';
import { hackathons } from '../db/schema';
import { AngelHackAdapter } from '../crawler/adapters/angelhack';
import { DevfolioAdapter } from '../crawler/adapters/devfolio';
import { DevpostAdapter } from '../crawler/adapters/devpost';
import { DiscordAdapter } from '../crawler/adapters/discord';
import { DoraHacksAdapter } from '../crawler/adapters/dorahacks';
import { EthGlobalAdapter } from '../crawler/adapters/ethglobal';
import { EventbriteAdapter } from '../crawler/adapters/eventbrite';
import { FacebookAdapter } from '../crawler/adapters/facebook';
import { GitHubEventsAdapter } from '../crawler/adapters/github';
import { Hack2SkillAdapter } from '../crawler/adapters/hack2skill';
import { HackClubAdapter } from '../crawler/adapters/hackclub';
import { HackerEarthAdapter } from '../crawler/adapters/hackerearth';
import { LablabAdapter } from '../crawler/adapters/lablab';
import { LinkedInAdapter } from '../crawler/adapters/linkedin';
import { LumaAdapter } from '../crawler/adapters/luma';
import { MeetupAdapter } from '../crawler/adapters/meetup';
import { MlhAdapter } from '../crawler/adapters/mlh';
import { RedditAdapter } from '../crawler/adapters/reddit';
import { ReskilllAdapter } from '../crawler/adapters/reskilll';
import { TaikaiAdapter } from '../crawler/adapters/taikai';
import { TelegramAdapter } from '../crawler/adapters/telegram';
import { TwitterAdapter } from '../crawler/adapters/twitter';
import { UnstopAdapter } from '../crawler/adapters/unstop';
import { UniversityAdapter } from '../crawler/adapters/university';
import { GoogleAdapter } from '../crawler/adapters/google';

const adapterMap: Record<string, () => any> = {
  devpost: () => new DevpostAdapter(),
  mlh: () => new MlhAdapter(),
  devfolio: () => new DevfolioAdapter(),
  unstop: () => new UnstopAdapter(),
  dorahacks: () => new DoraHacksAdapter(),
  taikai: () => new TaikaiAdapter(),
  hackerearth: () => new HackerEarthAdapter(),
  hack2skill: () => new Hack2SkillAdapter(),
  reskilll: () => new ReskilllAdapter(),
  lablab: () => new LablabAdapter(),
  ethglobal: () => new EthGlobalAdapter(),
  angelhack: () => new AngelHackAdapter(),
  hackclub: () => new HackClubAdapter(),
  university: () => new UniversityAdapter(),
  eventbrite: () => new EventbriteAdapter(),
  luma: () => new LumaAdapter(),
  meetup: () => new MeetupAdapter(),
  github: () => new GitHubEventsAdapter(),
  reddit: () => new RedditAdapter(),
  discord: () => new DiscordAdapter(),
  telegram: () => new TelegramAdapter(),
  linkedin: () => new LinkedInAdapter(),
  twitter: () => new TwitterAdapter(),
  facebook: () => new FacebookAdapter(),
  google: () => new GoogleAdapter(),
};

async function main(): Promise<void> {
  const target = process.argv[2]?.toLowerCase();
  if (!target) {
    console.error('Usage: npx ts-node src/debug/verifyAdapter.ts <adapter-id>');
    process.exit(1);
  }

  const factory = adapterMap[target];
  if (!factory) {
    console.error(`Unknown adapter: ${target}`);
    process.exit(1);
  }

  const adapter = factory();
  const source = adapter.id;
  const urls = typeof adapter.listingUrls === 'function' ? adapter.listingUrls() : [];
  const firstUrl = urls[0] ?? 'n/a';

  try {
    const response = await (adapter as any).fetchWithRetry(firstUrl);
    const result = await adapter.crawlListings();
    const parsed = (adapter as any).parsedItems ?? [];
    const issues = await adapter.validate();
    const validCount = Math.max(0, parsed.length - issues.length);

    const countRows = await db.select({ count: sql<number>`count(*)` }).from(hackathons).where(eq(hackathons.source, source as never));
    const dbCount = Number(countRows[0]?.count ?? 0);

    const sampleRows = await db
      .select({
        title: hackathons.title,
        description: hackathons.description,
        sourceUrl: hackathons.sourceUrl,
        organizerName: hackathons.organizerName,
        registrationDeadline: hackathons.registrationDeadline,
        prizeDescription: hackathons.prizeDescription,
        mode: hackathons.mode,
        themes: hackathons.themes,
      })
      .from(hackathons)
      .where(eq(hackathons.source, source as never))
      .orderBy(hackathons.updatedAt)
      .limit(5);

    const placeholderTitles = new Set([
      'MLH event',
      'Devfolio hackathon',
      'Unstop hackathon',
      'DoraHacks event',
      'TAIKAI event',
      'HackerEarth challenge',
      'Hack2skill event',
      'Reskilll event',
      'Lablab event',
      'ETHGlobal event',
      'AngelHack event',
      'Hack Club event',
      'University event',
      'Eventbrite event',
      'Luma event',
      'Meetup event',
      'GitHub event',
      'Reddit event',
      'Discord event',
      'Telegram event',
      'LinkedIn event',
      'Twitter event',
      'Facebook event',
      'Google event',
      'Hackathon',
      'Hackathon event',
      'Event',
    ]);

    const sampleLooksReal = sampleRows.some((row: any) => {
      const title = row.title?.trim() ?? '';
      return title.length > 5 && !placeholderTitles.has(title);
    });

    const hasRealFields = sampleRows.some((row: any) => {
      const title = row.title?.trim() ?? '';
      const description = row.description?.trim() ?? '';
      const organizer = row.organizerName?.trim() ?? '';
      const website = row.sourceUrl?.trim() ?? '';
      const deadline = row.registrationDeadline;
      const prize = row.prizeDescription?.trim() ?? '';
      const mode = row.mode;
      const themes = Array.isArray(row.themes) ? row.themes.filter(Boolean) : [];
      const hasMeaningfulDescription = description.length > 0 && description.toLowerCase() !== title.toLowerCase();
      return Boolean(title && website && (hasMeaningfulDescription || deadline || organizer || prize || (mode && mode !== 'unknown') || themes.some((theme: string) => theme !== 'open')));
    });

    const passed = result.itemsFound > 0 && parsed.length > 0 && validCount > 0 && dbCount > 0 && sampleLooksReal && hasRealFields;

    console.log(JSON.stringify({
      source,
      fetchSuccess: true,
      httpStatus: response?.statusCode ?? 'n/a',
      requestMethod: 'GET',
      apiHtmlGraphql: adapter.config?.crawlType ?? 'unknown',
      pagesCrawled: result.pages,
      requestsMade: result.requests,
      recordsFound: result.itemsFound,
      recordsParsed: parsed.length,
      recordsValid: validCount,
      inserted: result.newItems,
      updated: result.updatedItems,
      duplicates: result.duplicates,
      errors: result.failed,
      durationMs: result.durationMs,
      dbCount,
      sampleRows,
      status: passed ? 'PASS' : 'FAIL',
    }, null, 2));

    if (!passed) {
      throw new Error(`Verification failed for ${source}`);
    }
  } catch (error) {
    console.error(JSON.stringify({
      source,
      status: 'FAIL',
      error: error instanceof Error ? error.message : String(error),
    }, null, 2));
    process.exit(1);
  }
}

void main();
