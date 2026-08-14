import 'dotenv/config';

import { createServer, type ServerResponse, type IncomingMessage } from 'node:http';
import { URL } from 'node:url';

import { db } from './db';
import { hackathons, type Hackathon as DbHackathon } from './db/schema';
import { distributedLockService } from './crawler/core/distributedLock';
import { sourceIntervalService } from './crawler/core/sourceIntervals';
import { crawlQueueService } from './crawler/core/queueService';
import { crawlerMetrics, cacheRefreshStatus } from './db/schema';
import { computeHackathonStatus, resolveHackathonDeadline } from './pipeline/status';
import { eq, desc, count, sql } from 'drizzle-orm';
import { InitiativeSubmissionError, submitInitiativeApplication } from './services/initiativeApplications';
import {
  getFellowshipContributor,
  getFellowshipLeaderboard,
  getPublicContributors,
  recordMergedContribution,
  type RecordContributionInput,
} from './services/fellowship';

type ApiHackathon = {
  slug: string;
  title: string;
  platform: string;
  description: string;
  registrationDeadline: string | null;
  submissionDeadline: string | null;
  eventEndDate: string | null;
  mode: string;
  status: 'open' | 'closing-soon' | 'ended' | 'upcoming';
  country?: string;
  prize?: string;
  tags: string[];
  organizer: string;
  url: string;
  updatedHoursAgo: number;
};

const PORT = Number(process.env.PORT || 3001);
const HOST = '0.0.0.0';
const FRONTEND_URL = process.env.FRONTEND_URL?.trim().replace(/\/$/, '');
const INTERNAL_SECRET = process.env.HACKRADAR_INTERNAL_SECRET || process.env.INTERNAL_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'dev-secret-change-in-production');

function toApiHackathon(row: DbHackathon): ApiHackathon {
  const updatedAt = row.updatedAt ?? row.scrapedAt ?? new Date();

  return {
    slug: row.slug,
    title: row.title,
    platform: toPlatformLabel(row.source),
    description: row.description?.trim() || row.title,
    registrationDeadline: row.registrationDeadline?.toISOString() ?? null,
    submissionDeadline: row.submissionDeadline?.toISOString() ?? null,
    eventEndDate: row.endDate?.toISOString() ?? null,
    mode: toModeLabel(row.mode),
    status: getStatus(row),
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
  return computeHackathonStatus({
    registrationDeadline: row.registrationDeadline,
    submissionDeadline: row.submissionDeadline,
    eventEndDate: row.endDate,
  }).replace('_', '-') as 'open' | 'closing-soon' | 'ended' | 'upcoming';
}

function isLocalOrigin(origin: string): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) || /^https?:\/\/\[::1\](?::\d+)?$/.test(origin);
}

function isAllowedOrigin(origin: string): boolean {
  if (!origin) {
    return false;
  }

  if (FRONTEND_URL && origin === FRONTEND_URL) {
    return true;
  }

  return isLocalOrigin(origin);
}

function getCorsHeaders(origin?: string | null) {
  const allowedOrigin = origin && isAllowedOrigin(origin) ? origin : null;

  return {
    ...(allowedOrigin ? { 'Access-Control-Allow-Origin': allowedOrigin } : {}),
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function sendJson(res: ServerResponse, statusCode: number, body: unknown, origin?: string | null) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...getCorsHeaders(origin),
  });
  if (statusCode === 204) {
    res.end();
    return;
  }

  res.end(JSON.stringify(body));
}

function parseBody(req: IncomingMessage, maxBytes = 32 * 1024): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let body = '';
    let bytesRead = 0;

    req.on('data', (chunk) => {
      bytesRead += Buffer.byteLength(chunk);
      if (bytesRead > maxBytes) {
        reject(new Error('Request body too large'));
        req.destroy();
        return;
      }

      body += chunk;
    });

    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error('Invalid JSON payload'));
      }
    });
    req.on('error', reject);
  });
}

function getRequestIp(req: IncomingMessage): string {
  const forwardedFor = req.headers['x-forwarded-for'];

  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim();
  }

  if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
    return forwardedFor[0].split(',')[0].trim();
  }

  return req.socket.remoteAddress || 'unknown';
}

async function getHackathons(): Promise<DbHackathon[]> {
  return db.select().from(hackathons);
}

async function getProductionScheduler() {
  const { productionScheduler } = await import('./crawler/core/productionScheduler');
  return productionScheduler;
}
// Server-side filter builder: builds a WHERE expression using parameterized values
function buildWhereClause(params: URLSearchParams) {
  const clauses: any[] = [];
  const q = params.get('q') || params.get('search');
  const mode = params.get('mode');
  const status = params.get('status');
  const country = params.get('country');
  const theme = params.get('theme');
  const platform = params.get('platform') || params.get('source');

  if (mode && mode !== 'all') {
    const m = mode.toLowerCase().replace(/[-\s]/g, '_');
    const allowedModes = ['online', 'in_person', 'hybrid', 'unknown'];
    if (!allowedModes.includes(m)) throw new Error(`Invalid mode parameter: ${mode}`);
    clauses.push(sql`${hackathons.mode} = ${m}`);
  }

  if (status && status !== 'all') {
    // map display status to internal enum where needed
    const sval = status.toLowerCase().trim();
    const statusMap: Record<string, string> = {
      open: 'open', 'opening': 'open', 'closing-soon': 'closing_soon', 'closing soon': 'closing_soon', 'closing_soon': 'closing_soon', ended: 'ended', upcoming: 'upcoming', 'not started': 'upcoming'
    };
    const s = statusMap[sval];
    if (!s) throw new Error(`Invalid status parameter: ${status}`);
    clauses.push(sql`${hackathons.status} = ${s}`);
  }

  if (country) {
    const lowered = `%${country.toLowerCase()}%`;
    clauses.push(sql`(LOWER(${hackathons.countryCode}) LIKE ${lowered} OR LOWER(${hackathons.location}) LIKE ${lowered})`);
  }

  if (platform) {
    const p = platform.toLowerCase();
    const allowed = [
      'devpost','mlh','devfolio','unstop','dorahacks','taikai','hackerearth','hack2skill','reskilll','lablab','ethglobal','angelhack','hackclub','university','eventbrite','luma','meetup','github','reddit','discord','telegram','linkedin','twitter','facebook','google','manual'
    ];
    if (!allowed.includes(p)) throw new Error(`Invalid source/platform parameter: ${platform}`);
    clauses.push(sql`${hackathons.source} = ${p}`);
  }

  if (theme) {
    const t = theme.toLowerCase();
    // match against joined themes string
    clauses.push(sql`LOWER(array_to_string(${hackathons.themes}, ' ')) LIKE ${'%' + t + '%'}`);
  }

  if (q) {
    const like = `%${q}%`;
    clauses.push(sql`(${hackathons.title} ILIKE ${like} OR ${hackathons.description} ILIKE ${like} OR ${hackathons.organizerName} ILIKE ${like} OR array_to_string(${hackathons.themes}, ' ') ILIKE ${like})`);
  }

  if (clauses.length === 0) return null;
  // combine clauses with AND
  return clauses.reduce((acc, c) => (acc ? sql`${acc} AND ${c}` : c), null as any);
}

function checkInternalAuth(req: IncomingMessage): boolean {
  if (!INTERNAL_SECRET) {
    return false;
  }

  const auth = req.headers.authorization || '';
  return auth === `Bearer ${INTERNAL_SECRET}` || auth === INTERNAL_SECRET;
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
  const origin = typeof req.headers.origin === 'string' ? req.headers.origin : undefined;

  if (req.method === 'OPTIONS') {
    if (origin && !isAllowedOrigin(origin)) {
      sendJson(res, 403, { error: 'Origin not allowed' }, origin);
      return;
    }

    sendJson(res, 204, {}, origin);
    return;
  }

  if (url.pathname === '/internal/crawl' && req.method === 'POST') {
    if (!checkInternalAuth(req)) {
      sendJson(res, 401, { error: 'Unauthorized' }, origin);
      return;
    }
    try {
      const productionScheduler = await getProductionScheduler();
      const results = await productionScheduler.runFullCycle();
      const summary = {
        success: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        skipped: results.filter(r => r.skipped).length,
        totalSources: results.length,
        timestamp: new Date().toISOString(),
      };
      sendJson(res, 200, { success: true, summary, results }, origin);
    } catch (error) {
      console.error('[Internal Crawl] Error:', error);
      sendJson(res, 500, { success: false, error: 'Internal crawl failed.' }, origin);
    }
    return;
  }

  if (url.pathname === '/internal/lock/status' && req.method === 'GET') {
    if (!checkInternalAuth(req)) { sendJson(res, 401, { error: 'Unauthorized' }, origin); return; }
    const status = await distributedLockService.isLocked('scheduler_run', 'scheduler');
    sendJson(res, 200, status, origin);
    return;
  }

  if (url.pathname === '/internal/lock/release' && req.method === 'POST') {
    if (!checkInternalAuth(req)) { sendJson(res, 401, { error: 'Unauthorized' }, origin); return; }
    await distributedLockService.forceRelease('scheduler_run', 'scheduler');
    sendJson(res, 200, { released: true }, origin);
    return;
  }

  if (url.pathname === '/internal/intervals' && req.method === 'GET') {
    if (!checkInternalAuth(req)) { sendJson(res, 401, { error: 'Unauthorized' }, origin); return; }
    const intervals = await sourceIntervalService.getAllConfigs();
    sendJson(res, 200, intervals, origin);
    return;
  }

  if (url.pathname === '/internal/queue/stats' && req.method === 'GET') {
    if (!checkInternalAuth(req)) { sendJson(res, 401, { error: 'Unauthorized' }, origin); return; }
    const stats = await crawlQueueService.getQueueStats();
    sendJson(res, 200, stats, origin);
    return;
  }

  if (url.pathname === '/health' && req.method === 'GET') {
    sendJson(res, 200, { status: 'healthy', timestamp: new Date().toISOString(), uptime: process.uptime() }, origin);
    return;
  }

  if (url.pathname === '/crawler/status' && req.method === 'GET') {
    const productionScheduler = await getProductionScheduler();
    const health = await productionScheduler.getHealthStatus();
    sendJson(res, 200, health, origin);
    return;
  }

  if (url.pathname === '/crawler/history' && req.method === 'GET') {
    const limit = Number(url.searchParams.get('limit') || '100');
    const metrics = await db.select().from(crawlerMetrics).orderBy(desc(crawlerMetrics.startedAt)).limit(limit);
    sendJson(res, 200, metrics, origin);
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
    
    sendJson(res, 200, { periodHours: hours, sources: aggregated, raw: metrics }, origin);
    return;
  }

  if (url.pathname === '/crawler/queue' && req.method === 'GET') {
    const stats = await crawlQueueService.getQueueStats();
    const pending = await crawlQueueService.getDueJobs(50);
    const retry = await db.select().from(crawlerMetrics).where(eq(crawlerMetrics.crawlType, 'retry')).orderBy(desc(crawlerMetrics.startedAt)).limit(50);
    sendJson(res, 200, { stats, pending, retry }, origin);
    return;
  }

  if (url.pathname === '/crawler/cache' && req.method === 'GET') {
    const cache = await db.select().from(cacheRefreshStatus);
    sendJson(res, 200, cache, origin);
    return;
  }

  // Allow POST for the initiative application endpoint; otherwise only GET is permitted
  if (
    req.method !== 'GET' &&
    !(url.pathname === '/api/initiative/applications' && req.method === 'POST') &&
    !(url.pathname === '/internal/fellowship/contributions' && req.method === 'POST')
  ) {
    sendJson(res, 405, { error: 'Method not allowed' }, origin);
    return;
  }

  if (url.pathname === '/api/contributors' && req.method === 'GET') {
    const contributors = await getPublicContributors();
    sendJson(res, 200, {
      updatedAt: new Date().toISOString(),
      contributors,
    }, origin);
    return;
  }

  if (url.pathname === '/api/fellowship/leaderboard' && req.method === 'GET') {
    const leaderboard = await getFellowshipLeaderboard();
    sendJson(res, 200, {
      updatedAt: new Date().toISOString(),
      leaderboard,
    }, origin);
    return;
  }

  const fellowshipContributorMatch = url.pathname.match(/^\/api\/fellowship\/contributors\/([^/]+)$/);
  if (fellowshipContributorMatch && req.method === 'GET') {
    const username = decodeURIComponent(fellowshipContributorMatch[1]);
    const contributor = await getFellowshipContributor(username);
    if (!contributor) {
      sendJson(res, 404, { error: 'Contributor not found' }, origin);
      return;
    }
    sendJson(res, 200, { contributor, updatedAt: new Date().toISOString() }, origin);
    return;
  }

  if (url.pathname === '/internal/fellowship/contributions' && req.method === 'POST') {
    if (!checkInternalAuth(req)) {
      sendJson(res, 401, { error: 'Unauthorized' }, origin);
      return;
    }

    try {
      const body = await parseBody(req, 64 * 1024);
      const result = await recordMergedContribution(body as RecordContributionInput);
      sendJson(res, result.recorded ? 201 : 200, {
        success: result.recorded,
        duplicate: result.duplicate,
        ...(result.recorded ? { contribution: result.contribution } : {}),
        ...(result.recorded || result.duplicate ? {} : { reason: result.reason }),
      }, origin);
      return;
    } catch (error) {
      if (error instanceof Error && error.message === 'Invalid JSON payload') {
        sendJson(res, 400, { success: false, error: error.message }, origin);
        return;
      }
      if (error instanceof Error && error.message === 'Request body too large') {
        sendJson(res, 413, { success: false, error: error.message }, origin);
        return;
      }
      console.error('[Fellowship] Contribution record failed:', error);
      sendJson(res, 500, { success: false, error: 'Unable to record contribution.' }, origin);
      return;
    }
  }

  if (url.pathname === '/api/hackathons') {
    // Build server-side filters when query parameters are present
    let where;
    try {
      where = buildWhereClause(url.searchParams);
    } catch (err) {
      // Parameter validation failed
      const message = err instanceof Error ? err.message : 'Invalid parameters';
      sendJson(res, 400, { error: message }, origin);
      return;
    }
    let rows: DbHackathon[];
    if (where) {
      // sorting: only allow predefined options
      const sort = url.searchParams.get('sort') || 'closing';
      const orderExpr = sql`COALESCE(${hackathons.registrationDeadline}, ${hackathons.submissionDeadline}, ${hackathons.endDate}, ${hackathons.updatedAt})`;
      if (sort === 'closing') {
        rows = await db.select().from(hackathons).where(where).orderBy(orderExpr);
      } else if (sort === 'newest') {
        rows = await db.select().from(hackathons).where(where).orderBy(sql`${hackathons.updatedAt} DESC`);
      } else {
        sendJson(res, 400, { error: `Invalid sort parameter: ${sort}` }, origin);
        return;
      }
    } else {
      rows = await getHackathons();
    }

    // Maintain previous behavior: filter out ended unless explicitly requested
    const requestedStatus = url.searchParams.get('status')?.toLowerCase();
    const filtered = rows.filter((row) => {
      const status = getStatus(row);
      if (status === 'ended' && requestedStatus !== 'ended') return false;
      return true;
    });

    sendJson(res, 200, filtered.map(toApiHackathon), origin);
    return;
  }

  if (url.pathname === '/api/initiative/applications' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const result = await submitInitiativeApplication(body, getRequestIp(req));
      sendJson(res, 201, {
        success: true,
        applicationId: result.application.id,
        emailSent: result.emailSent,
        message: 'Your application was received successfully.',
      }, origin);
      return;
    } catch (err) {
      if (err instanceof InitiativeSubmissionError) {
        sendJson(res, err.statusCode, { success: false, error: err.message }, origin);
        return;
      }

      if (err instanceof Error && err.message === 'Invalid JSON payload') {
        sendJson(res, 400, { success: false, error: err.message }, origin);
        return;
      }

      if (err instanceof Error && err.message === 'Request body too large') {
        sendJson(res, 413, { success: false, error: err.message }, origin);
        return;
      }

      console.error('[Initiative] Unexpected submission error:', err);
      sendJson(res, 500, { success: false, error: 'Your application could not be saved. Please try again.' }, origin);
      return;
    }
  }

  const match = url.pathname.match(/^\/api\/hackathons\/([^/]+)$/);
  if (match) {
    const slug = decodeURIComponent(match[1]);
    const rows = await getHackathons();
    const row = rows.find((item) => item.slug === slug);
    if (!row) { sendJson(res, 404, { error: 'Not found' }, origin); return; }
    sendJson(res, 200, toApiHackathon(row), origin);
    return;
  }

  sendJson(res, 404, { error: 'Not found' }, origin);
});

server.listen(PORT, HOST, () => {
  console.info(`HackRadar API listening on http://${HOST}:${PORT}`);
  console.info(`Internal endpoints available at /internal/* (requires INTERNAL_SECRET)`);
  console.info(`Health endpoints: /health, /crawler/status, /crawler/history, /crawler/metrics, /crawler/queue, /crawler/cache`);
});

let localSchedulerInterval: NodeJS.Timeout | null = null;
if (process.env.LOCAL_SCHEDULER === 'true' && process.env.NODE_ENV !== 'production') {
  const intervalMs = Number(process.env.SCHEDULER_INTERVAL_MS) || 300000;
  console.info(`[Local Scheduler] Starting with interval ${intervalMs}ms`);
  localSchedulerInterval = setInterval(async () => {
    try {
      const productionScheduler = await getProductionScheduler();
      await productionScheduler.runFullCycle();
    } catch (e) {
      console.error('[Local Scheduler] Error:', e);
    }
  }, intervalMs);
}

process.on('SIGTERM', async () => {
  console.info('SIGTERM received, shutting down...');
  if (localSchedulerInterval) clearInterval(localSchedulerInterval);
  await distributedLockService.forceRelease('scheduler_run', 'scheduler');
  server.close(() => process.exit(0));
});
