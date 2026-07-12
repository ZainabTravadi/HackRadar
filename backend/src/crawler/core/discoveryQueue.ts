import { eq, sql } from 'drizzle-orm';
import * as cheerio from 'cheerio';

import { db } from '../../db';
import { discoveryQueue } from '../../db/schema';

export interface DiscoveryCandidate {
  sourceUrl: string;
  canonicalUrl: string;
  ownerAdapter: string;
}

export interface DiscoveryMetrics {
  urlsFound: number;
  canonicalUrls: number;
  duplicates: number;
  queued: number;
  ignored: number;
}

export async function ensureDiscoveryQueueTable(): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS discovery_queue (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      source text NOT NULL,
      discovered_url text NOT NULL,
      canonical_url text NOT NULL,
      owner_adapter text NOT NULL,
      status text NOT NULL DEFAULT 'queued',
      discovered_at timestamptz NOT NULL DEFAULT now(),
      last_seen_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS discovery_queue_canonical_url_idx ON discovery_queue (canonical_url)`);
}

export async function hasDiscoveryQueueEntry(canonicalUrl: string): Promise<boolean> {
  const existing = await db.select({ id: discoveryQueue.id }).from(discoveryQueue).where(eq(discoveryQueue.canonicalUrl, canonicalUrl)).limit(1);
  return existing.length > 0;
}

export async function enqueueDiscoveryCandidate(source: string, discoveredUrl: string, canonicalUrl: string, ownerAdapter: string): Promise<void> {
  await ensureDiscoveryQueueTable();
  await db.insert(discoveryQueue).values({
    source,
    discoveredUrl,
    canonicalUrl,
    ownerAdapter,
    status: 'queued',
  }).onConflictDoNothing();
}

export async function collectDiscoveryMetrics(html: string, sourceUrl: string, source: string): Promise<DiscoveryMetrics> {
  const $ = cheerio.load(html);
  const anchors = $('a[href]').toArray();
  const metrics: DiscoveryMetrics = {
    urlsFound: anchors.length,
    canonicalUrls: 0,
    duplicates: 0,
    queued: 0,
    ignored: 0,
  };

  for (const element of anchors) {
    const href = $(element).attr('href');
    if (!href) {
      metrics.ignored += 1;
      continue;
    }

    const normalized = normalizeUrl(href, sourceUrl);
    if (!normalized) {
      metrics.ignored += 1;
      continue;
    }

    const owner = classifyCanonicalUrl(normalized);
    if (!owner) {
      metrics.ignored += 1;
      continue;
    }

    metrics.canonicalUrls += 1;
    if (await hasDiscoveryQueueEntry(owner.canonicalUrl)) {
      metrics.duplicates += 1;
      continue;
    }

    await enqueueDiscoveryCandidate(source, normalized, owner.canonicalUrl, owner.ownerAdapter);
    metrics.queued += 1;
  }

  return metrics;
}

export function extractDiscoveryCandidates(html: string, sourceUrl: string): DiscoveryCandidate[] {
  const $ = cheerio.load(html);
  const results = new Map<string, DiscoveryCandidate>();

  $('a[href]').each((_, element) => {
    const href = $(element).attr('href');
    if (!href) {
      return;
    }

    const normalized = normalizeUrl(href, sourceUrl);
    if (!normalized) {
      return;
    }

    const owner = classifyCanonicalUrl(normalized);
    if (!owner) {
      return;
    }

    results.set(normalized, {
      sourceUrl: normalized,
      canonicalUrl: owner.canonicalUrl,
      ownerAdapter: owner.ownerAdapter,
    });
  });

  return Array.from(results.values());
}

function normalizeUrl(href: string, sourceUrl: string): string | null {
  try {
    const parsed = new URL(href, sourceUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }
    parsed.hash = '';
    return parsed.toString();
  } catch {
    return null;
  }
}

function classifyCanonicalUrl(url: string): { canonicalUrl: string; ownerAdapter: string } | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname.toLowerCase();

    if (host.includes('devpost.com')) {
      return { canonicalUrl: parsed.toString(), ownerAdapter: 'devpost' };
    }

    if (host.includes('mlh.io')) {
      return { canonicalUrl: parsed.toString(), ownerAdapter: 'mlh' };
    }

    if (host.includes('devfolio.co')) {
      return { canonicalUrl: parsed.toString(), ownerAdapter: 'devfolio' };
    }

    if (host.includes('unstop.com')) {
      return { canonicalUrl: parsed.toString(), ownerAdapter: 'unstop' };
    }

    if (host.includes('dorahacks.io')) {
      return { canonicalUrl: parsed.toString(), ownerAdapter: 'dorahacks' };
    }

    if (host.includes('taikai.network')) {
      return { canonicalUrl: parsed.toString(), ownerAdapter: 'taikai' };
    }

    if (host.includes('hackerearth.com')) {
      return { canonicalUrl: parsed.toString(), ownerAdapter: 'hackerearth' };
    }

    if (host.includes('hack2skill.com')) {
      return { canonicalUrl: parsed.toString(), ownerAdapter: 'hack2skill' };
    }

    if (host.includes('reskilll.com')) {
      return { canonicalUrl: parsed.toString(), ownerAdapter: 'reskilll' };
    }

    if (host.includes('ethglobal.com')) {
      return { canonicalUrl: parsed.toString(), ownerAdapter: 'ethglobal' };
    }

    if (host.includes('lablab.ai')) {
      return { canonicalUrl: parsed.toString(), ownerAdapter: 'lablab' };
    }

    if (host.includes('angelhack.com')) {
      return { canonicalUrl: parsed.toString(), ownerAdapter: 'angelhack' };
    }

    if (host.includes('eventbrite.com')) {
      return { canonicalUrl: parsed.toString(), ownerAdapter: 'eventbrite' };
    }

    if (host.includes('meetup.com')) {
      return { canonicalUrl: parsed.toString(), ownerAdapter: 'meetup' };
    }

    if (host.includes('lu.ma')) {
      return { canonicalUrl: parsed.toString(), ownerAdapter: 'luma' };
    }

    if (host.includes('hackclub.com') || host.includes('hackathons.hackclub.com')) {
      return { canonicalUrl: parsed.toString(), ownerAdapter: 'hackclub' };
    }

    if (host.includes('hackathon.cornell.edu') || path.includes('hackathon')) {
      return { canonicalUrl: parsed.toString(), ownerAdapter: 'university' };
    }

    return null;
  } catch {
    return null;
  }
}
