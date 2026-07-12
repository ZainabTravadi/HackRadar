import 'dotenv/config';

import { createServer, type ServerResponse, type IncomingMessage } from 'node:http';
import { URL } from 'node:url';

import { db } from './db';
import { hackathons, type Hackathon as DbHackathon } from './db/schema';
import { productionScheduler } from './crawler/core/productionScheduler';
import { distributedLockService } from './crawler/core/distributedLock';
import { sourceIntervalService } from './crawler/core/sourceIntervals';
import { crawlQueueService } from './crawler/core/queueService';
import { crawlerMetrics, cacheRefreshStatus } from './db/schema';
import { eq, desc, count, sql } from 'drizzle-orm';

type ApiHackathon = {
  slug: string;
  title: string;
  platform: string;
  description: string;
  registrationDeadline: string;
  submissionDeadline: string;
  mode: string;
  country?: string;
  prize?: string;
  tags: string[];
  organizer: string;
  url: string;
  updatedHoursAgo: number;
};

const PORT = Number(process.env.API_PORT ?? process.env.PORT ?? 3001);
const INTERNAL_SECRET = process.env.INTERNAL_SECRET || 'dev-secret-change-in-production';

function toApiHackathon(row: DbHackathon): ApiHackathon {
  const updatedAt = row.updatedAt ?? row.scrapedAt ?? new Date();
  const deadline = row.registrationDeadline ?? row.submissionDeadline ?? row.startDate ?? row.endDate ?? updatedAt;

  return {
    slug: row.slug,
    title: row.title,
    platform: toPlatformLabel(row.source),
    description: row.description?.trim() || row.title,
    registrationDeadline: deadline.toISOString(),
    submissionDeadline: (row.submissionDeadline ?? deadline).toISOString(),
    mode: toModeLabel(row.mode),
    country: row.countryCode ?? undefined,
    prize: row.prizeDescription?.trim() || formatPrize(row.prizePool),
    tags: Array.isArray(row.themes) ? row.themes.filter(Boolean) : [],
    organizer: row.organizerName?.trim() || toPlatformLabel(row.source),
    url: row.sourceUrl,
    updatedHoursAgo: Math.max(0, Math.floor((Date.now() - updatedAt.getTime()) / 3_600_000)),
  };
}

function toPlatformLabel(source: DbHackathon['source']): string {
  const labels: Record<DbHackathon['source'], string> = {
    devpost: 'Devpost', mlh: 'MLH', devfolio: 'Devfolio', unstop: 'Unstop', dorahacks: 'DoraHacks',
    taikai: 'TAIKAI', hackerearth: 'HackerEarth', hack2skill: 'Hack2Skill', reskilll: 'Reskilll',
    lablab: 'lablab.ai', ethglobal: 'ETHGlobal', angelhack: 'AngelHack', hackclub: 'Hack Club',
    university: 'University', eventbrite: 'Eventbrite', luma: 'Luma', meetup: 'Meetup',
    github: 'GitHub Events', reddit: 'Reddit', discord: 'Discord', telegram: 'Telegram',
    linkedin: 'LinkedIn', twitter: 'X', facebook: 'Facebook', google: 'Google Events', manual: 'Manual',
  };
  return labels[source] ?? source;
}

function toModeLabel(mode: DbHackathon['mode']): string {
  const labels: Record<DbHackathon['mode'], string> = { online: 'Online', in_person: 'In-person', hybrid: 'Hybrid', unknown: 'Unknown' };
  return labels[mode];
}

function formatPrize(value: number | null): string | undefined {
  if (value == null) return undefined;
  return `$${Number(value).toLocaleString('en-US')}`;
}

function getStatus(row: DbHackathon): 'open' | 'closing-soon' | 'ended' | 'upcoming' {
  const deadline = row.registrationDeadline ?? row.submissionDeadline ?? row.startDate ?? row.endDate;
  if (!deadline) return 'upcoming';
  const days = Math.ceil((deadline.getTime() - Date.now()) / 86_400_000);
  if (days <= 0) return 'ended';
  if (days <= 3) return 'closing-soon';
  return 'open';
}

function sendJson(res: ServerResponse, statusCode: number, body: unknown) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(body));
}

function parseBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); } catch { resolve({}); }
    });
    req.on('error', reject);
  });
}

async function getHackathons(): Promise<DbHackathon[]> {
  return db.select().from(hackathons);
}

function applyFilters(rows: DbHackathon[], params: URLSearchParams): DbHackathon[] {
  const mode = params.get('mode')?.toLowerCase();
  const status = params.get('status')?.toLowerCase();
  const country = params.get('country')?.toLowerCase();
  const theme = params.get('theme')?.toLowerCase();
  const platform = params.get('platform')?.toLowerCase();

  return rows.filter((row) => {
    if (mode && toModeLabel(row.mode).toLowerCase() !== mode) return false;
    if (country) {
      const rowCountry = (row.countryCode ?? row.location ?? '').toLowerCase();
      if (!rowCountry.includes(country)) return false;
    }
    if (theme && !(row.themes ?? []).some((value) => value.toLowerCase() === theme)) return false;
    if (platform && toPlatformLabel(row.source).toLowerCase() !== platform) return false;
    if (status && getStatus(row) !== status) return false;
    return true;
  });
}

function checkInternalAuth(req: IncomingMessage): boolean {
  const auth = req.headers.authorization || '';
  return auth === `Bearer ${INTERNAL_SECRET}` || auth === INTERNAL_SECRET;
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);

  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {});
    return;
  }

  if (url.pathname === '/internal/crawl' && req.method === 'POST') {
    if (!checkInternalAuth(req)) {
      sendJson(res, 401, { error: 'Unauthorized' });
      return;
    }
    try {
      const results = await productionScheduler.runFullCycle();
      const summary = {
        success: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        skipped: results.filter(r => r.skipped).length,
        totalSources: results.length,
        timestamp: new Date().toISOString(),
      };
      sendJson(res, 200, { success: true, summary, results });
    } catch (error) {
      console.error('[Internal Crawl] Error:', error);
      sendJson(res, 500, { success: false, error: error instanceof Error ? error.message : String(error) });
    }
    return;
  }

  if (url.pathname === '/internal/lock/status' && req.method === 'GET') {
    if (!checkInternalAuth(req)) { sendJson(res, 401, { error: 'Unauthorized' }); return; }
    const status = await distributedLockService.isLocked('scheduler_run', 'scheduler');
    sendJson(res, 200, status);
    return;
  }

  if (url.pathname === '/internal/lock/release' && req.method === 'POST') {
    if (!checkInternalAuth(req)) { sendJson(res, 401, { error: 'Unauthorized' }); return; }
    await distributedLockService.forceRelease('scheduler_run', 'scheduler');
    sendJson(res, 200, { released: true });
    return;
  }

  if (url.pathname === '/internal/intervals' && req.method === 'GET') {
    if (!checkInternalAuth(req)) { sendJson(res, 401, { error: 'Unauthorized' }); return; }
    const intervals = await sourceIntervalService.getAllConfigs();
    sendJson(res, 200, intervals);
    return;
  }

  if (url.pathname === '/internal/queue/stats' && req.method === 'GET') {
    if (!checkInternalAuth(req)) { sendJson(res, 401, { error: 'Unauthorized' }); return; }
    const stats = await crawlQueueService.getQueueStats();
    sendJson(res, 200, stats);
    return;
  }

  if (url.pathname === '/health' && req.method === 'GET') {
    sendJson(res, 200, { status: 'healthy', timestamp: new Date().toISOString(), uptime: process.uptime() });
    return;
  }

  if (url.pathname === '/crawler/status' && req.method === 'GET') {
    const health = await productionScheduler.getHealthStatus();
    sendJson(res, 200, health);
    return;
  }

  if (url.pathname === '/crawler/history' && req.method === 'GET') {
    const limit = Number(url.searchParams.get('limit') || '100');
    const metrics = await db.select().from(crawlerMetrics).orderBy(desc(crawlerMetrics.startedAt)).limit(limit);
    sendJson(res, 200, metrics);
    return;
  }

  if (url.pathname === '/crawler/metrics' && req.method === 'GET') {
    const hours = Number(url.searchParams.get('hours') || '24');
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    const metrics = await db.select().from(crawlerMetrics).where(sql`${crawlerMetrics.startedAt} >= ${since}`).orderBy(desc(crawlerMetrics.startedAt));
    
    const aggregated = metrics.reduce((acc, m) => {
      if (!acc[m.source]) acc[m.source] = { total: 0, success: 0, failed: 0, itemsFound: 0, itemsNew: 0, avgDuration: 0 };
      acc[m.source].total++;
      if (m.success) acc[m.source].success++; else acc[m.source].failed++;
      acc[m.source].itemsFound += m.itemsFound || 0;
      acc[m.source].itemsNew += m.itemsNew || 0;
      acc[m.source].avgDuration = ((acc[m.source].avgDuration * (acc[m.source].total - 1)) + (m.durationMs || 0)) / acc[m.source].total;
      return acc;
    }, {} as Record<string, any>);
    
    sendJson(res, 200, { periodHours: hours, sources: aggregated, raw: metrics });
    return;
  }

  if (url.pathname === '/crawler/queue' && req.method === 'GET') {
    const stats = await crawlQueueService.getQueueStats();
    const pending = await crawlQueueService.getDueJobs(50);
    const retry = await db.select().from(crawlerMetrics).where(eq(crawlerMetrics.crawlType, 'retry')).orderBy(desc(crawlerMetrics.startedAt)).limit(50);
    sendJson(res, 200, { stats, pending, retry });
    return;
  }

  if (url.pathname === '/crawler/cache' && req.method === 'GET') {
    const cache = await db.select().from(cacheRefreshStatus);
    sendJson(res, 200, cache);
    return;
  }

  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  if (url.pathname === '/api/hackathons') {
    const rows = await getHackathons();
    const filtered = applyFilters(rows, url.searchParams).filter((row) => getStatus(row) !== 'ended' || url.searchParams.get('status')?.toLowerCase() === 'ended');
    filtered.sort((a, b) => {
      const aDeadline = a.registrationDeadline ?? a.submissionDeadline ?? a.startDate ?? a.endDate ?? a.updatedAt ?? a.scrapedAt;
      const bDeadline = b.registrationDeadline ?? b.submissionDeadline ?? b.startDate ?? b.endDate ?? b.updatedAt ?? b.scrapedAt;
      return aDeadline.getTime() - bDeadline.getTime();
    });
    sendJson(res, 200, filtered.map(toApiHackathon));
    return;
  }

  const match = url.pathname.match(/^\/api\/hackathons\/([^/]+)$/);
  if (match) {
    const slug = decodeURIComponent(match[1]);
    const rows = await getHackathons();
    const row = rows.find((item) => item.slug === slug);
    if (!row) { sendJson(res, 404, { error: 'Not found' }); return; }
    sendJson(res, 200, toApiHackathon(row));
    return;
  }

  sendJson(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  console.info(`HackRadar API listening on http://localhost:${PORT}`);
  console.info(`Internal endpoints available at /internal/* (requires INTERNAL_SECRET)`);
  console.info(`Health endpoints: /health, /crawler/status, /crawler/history, /crawler/metrics, /crawler/queue, /crawler/cache`);
});

let localSchedulerInterval: NodeJS.Timeout | null = null;
if (process.env.LOCAL_SCHEDULER === 'true') {
  const intervalMs = Number(process.env.SCHEDULER_INTERVAL_MS) || 300000;
  console.info(`[Local Scheduler] Starting with interval ${intervalMs}ms`);
  localSchedulerInterval = setInterval(async () => {
    try { await productionScheduler.runFullCycle(); } catch (e) { console.error('[Local Scheduler] Error:', e); }
  }, intervalMs);
}

process.on('SIGTERM', async () => {
  console.info('SIGTERM received, shutting down...');
  if (localSchedulerInterval) clearInterval(localSchedulerInterval);
  await distributedLockService.forceRelease('scheduler_run', 'scheduler');
  process.exit(0);
});