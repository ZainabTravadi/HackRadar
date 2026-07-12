import { eq } from 'drizzle-orm';

import { db } from '../../db';
import { hackathons, scrapeLogs } from '../../db/schema';
import { AngelHackAdapter } from '../adapters/angelhack';
import { DevfolioAdapter } from '../adapters/devfolio';
import { DevpostAdapter } from '../adapters/devpost';
import { DiscordAdapter } from '../adapters/discord';
import { DoraHacksAdapter } from '../adapters/dorahacks';
import { EthGlobalAdapter } from '../adapters/ethglobal';
import { EventbriteAdapter } from '../adapters/eventbrite';
import { FacebookAdapter } from '../adapters/facebook';
import { GitHubEventsAdapter } from '../adapters/github';
import { Hack2SkillAdapter } from '../adapters/hack2skill';
import { HackClubAdapter } from '../adapters/hackclub';
import { HackerEarthAdapter } from '../adapters/hackerearth';
import { LinkedInAdapter } from '../adapters/linkedin';
import { LablabAdapter } from '../adapters/lablab';
import { LumaAdapter } from '../adapters/luma';
import { MeetupAdapter } from '../adapters/meetup';
import { MlhAdapter } from '../adapters/mlh';
import { RedditAdapter } from '../adapters/reddit';
import { ReskilllAdapter } from '../adapters/reskilll';
import { TaikaiAdapter } from '../adapters/taikai';
import { TelegramAdapter } from '../adapters/telegram';
import { TwitterAdapter } from '../adapters/twitter';
import { UnstopAdapter } from '../adapters/unstop';
import { UniversityAdapter } from '../adapters/university';
import { GoogleAdapter } from '../adapters/google';
import { getSourceMetadata, getSourceClassification } from './sourceMetadata';
import { type CrawlResult, type SourceAdapter } from './types';

export class Scheduler {
  constructor(private readonly adapters: SourceAdapter[] = []) {}

  getAdapters(): SourceAdapter[] {
    return this.adapters;
  }

  async runAll(): Promise<void> {
    for (const adapter of this.adapters) {
      await this.runOne(adapter);
    }
  }

  async runOne(adapter: SourceAdapter): Promise<CrawlResult> {
    const startedAt = Date.now();
    let scrapeLogId: string | undefined;
    try {
      const insertedLog = await db.insert(scrapeLogs).values({ source: adapter.id as never }).returning({ id: scrapeLogs.id });
      scrapeLogId = insertedLog[0]?.id;
    } catch (error: unknown) {
      console.warn(`[${(adapter as any).name ?? adapter.id}] failed to write scrape log: ${error instanceof Error ? error.message : String(error)}; continuing without log id.`);
      scrapeLogId = undefined;
    }

    try {
      const metadata = getSourceMetadata(adapter.id);
      const classification = getSourceClassification((adapter as unknown as { config?: { sourceClassification?: string } }).config as any, adapter.id);
      const isDiscovery = classification === 'DISCOVERY';

      if (isDiscovery) {
        const listings = await adapter.crawlListings();
        const parsed = await adapter.parse();
        const normalized = await adapter.normalize();
        const issues = await adapter.validate();

        for (const item of normalized) {
          await db.insert(hackathons).values(item).onConflictDoNothing();
        }

        if (scrapeLogId) {
          try {
            await db
              .update(scrapeLogs)
              .set({
                completedAt: new Date(),
                recordsFound: listings.itemsFound,
                recordsNew: listings.newItems,
                recordsUpdated: listings.updatedItems,
                success: true,
              })
              .where(eq(scrapeLogs.id, scrapeLogId));
          } catch (error: unknown) {
            console.warn(`[${(adapter as any).name ?? adapter.id}] failed to update scrape log: ${error instanceof Error ? error.message : String(error)}`);
          }
        }

        const discoveryMetrics = (adapter as unknown as { discoveryMetrics?: { urlsFound: number; canonicalUrls: number; duplicates: number; queued: number; ignored: number } }).discoveryMetrics;
        console.info(`[${adapter.name}] classification=${metadata.classification} role=discovery pages=${listings.pages} items=${listings.itemsFound} urlsFound=${discoveryMetrics?.urlsFound ?? 0} canonical=${discoveryMetrics?.canonicalUrls ?? 0} duplicates=${discoveryMetrics?.duplicates ?? 0} queued=${discoveryMetrics?.queued ?? 0} ignored=${discoveryMetrics?.ignored ?? 0}`);
        return listings;
      }

      const listings = await adapter.crawlListings();
      const details = await adapter.crawlDetails();
      const parsed = await adapter.parse();
      const normalized = await adapter.normalize();
      const issues = await adapter.validate();

      for (const item of normalized) {
        await db.insert(hackathons).values(item).onConflictDoNothing();
      }

      if (scrapeLogId) {
        try {
          await db
            .update(scrapeLogs)
            .set({
              completedAt: new Date(),
              recordsFound: listings.itemsFound,
              recordsNew: listings.newItems,
              recordsUpdated: listings.updatedItems,
              success: true,
            })
            .where(eq(scrapeLogs.id, scrapeLogId));
        } catch (error: unknown) {
          console.warn(`[${(adapter as any).name ?? adapter.id}] failed to update scrape log: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      console.info(`[${adapter.name}] pages=${listings.pages} items=${listings.itemsFound} new=${listings.newItems} updated=${listings.updatedItems} duplicates=${listings.duplicates} failed=${listings.failed} durationMs=${Date.now() - startedAt} requests=${listings.requests} avgResponse=${listings.averageResponseTimeMs}`);

      return listings;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      if (scrapeLogId) {
        try {
          await db
            .update(scrapeLogs)
            .set({ completedAt: new Date(), success: false, errorMessage: message })
            .where(eq(scrapeLogs.id, scrapeLogId));
        } catch (err: unknown) {
          console.warn(`[${(adapter as any).name ?? adapter.id}] failed to update scrape log on error: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
      console.error(`[${adapter.name}] failed: ${message}`);
      return {
        source: adapter.id,
        pages: 0,
        itemsFound: 0,
        newItems: 0,
        updatedItems: 0,
        duplicates: 0,
        failed: 1,
        durationMs: Date.now() - startedAt,
        requests: 0,
        averageResponseTimeMs: 0,
      };
    }
  }
}

export function createDefaultScheduler(): Scheduler {
  return new Scheduler([
    new DevpostAdapter(),
    new MlhAdapter(),
    new DevfolioAdapter(),
    new UnstopAdapter(),
    new DoraHacksAdapter(),
    new TaikaiAdapter(),
    new HackerEarthAdapter(),
    new Hack2SkillAdapter(),
    new ReskilllAdapter(),
    new LablabAdapter(),
    new EthGlobalAdapter(),
    new AngelHackAdapter(),
    new HackClubAdapter(),
    new UniversityAdapter(),
    new EventbriteAdapter(),
    new LumaAdapter(),
    new MeetupAdapter(),
    new GitHubEventsAdapter(),
    new RedditAdapter(),
    new DiscordAdapter(),
    new TelegramAdapter(),
    new LinkedInAdapter(),
    new TwitterAdapter(),
    new FacebookAdapter(),
    new GoogleAdapter(),
  ]);
}
