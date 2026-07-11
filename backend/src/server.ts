import 'dotenv/config';

import { createServer, type ServerResponse } from 'node:http';
import { URL } from 'node:url';

import { db } from './db';
import { hackathons, type Hackathon as DbHackathon } from './db/schema';

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
    devpost: 'Devpost',
    mlh: 'MLH',
    devfolio: 'Devfolio',
    unstop: 'Unstop',
    dorahacks: 'DoraHacks',
    taikai: 'TAIKAI',
    hackerearth: 'HackerEarth',
    hack2skill: 'Hack2Skill',
    reskilll: 'Reskilll',
    lablab: 'lablab.ai',
    ethglobal: 'ETHGlobal',
    angelhack: 'AngelHack',
    hackclub: 'Hack Club',
    university: 'University',
    eventbrite: 'Eventbrite',
    luma: 'Luma',
    meetup: 'Meetup',
    github: 'GitHub Events',
    reddit: 'Reddit',
    discord: 'Discord',
    telegram: 'Telegram',
    linkedin: 'LinkedIn',
    twitter: 'X',
    facebook: 'Facebook',
    google: 'Google Events',
    manual: 'Manual',
  };

  return labels[source] ?? source;
}

function toModeLabel(mode: DbHackathon['mode']): string {
  const labels: Record<DbHackathon['mode'], string> = {
    online: 'Online',
    in_person: 'In-person',
    hybrid: 'Hybrid',
    unknown: 'Unknown',
  };

  return labels[mode];
}

function formatPrize(value: number | null): string | undefined {
  if (value == null) {
    return undefined;
  }

  return `$${Number(value).toLocaleString('en-US')}`;
}

function getStatus(row: DbHackathon): 'open' | 'closing-soon' | 'ended' | 'upcoming' {
  const deadline = row.registrationDeadline ?? row.submissionDeadline ?? row.startDate ?? row.endDate;
  if (!deadline) {
    return 'upcoming';
  }

  const days = Math.ceil((deadline.getTime() - Date.now()) / 86_400_000);
  if (days <= 0) {
    return 'ended';
  }
  if (days <= 3) {
    return 'closing-soon';
  }
  return 'open';
}

function sendJson(res: ServerResponse, statusCode: number, body: unknown) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(body));
}

async function getHackathons(): Promise<DbHackathon[]> {
  return db.select().from(hackathons);
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);

  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {});
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
    if (!row) {
      sendJson(res, 404, { error: 'Not found' });
      return;
    }
    sendJson(res, 200, toApiHackathon(row));
    return;
  }

  sendJson(res, 404, { error: 'Not found' });
});

function applyFilters(rows: DbHackathon[], params: URLSearchParams): DbHackathon[] {
  const mode = params.get('mode')?.toLowerCase();
  const status = params.get('status')?.toLowerCase();
  const country = params.get('country')?.toLowerCase();
  const theme = params.get('theme')?.toLowerCase();
  const platform = params.get('platform')?.toLowerCase();

  return rows.filter((row) => {
    if (mode && toModeLabel(row.mode).toLowerCase() !== mode) {
      return false;
    }
    if (country) {
      const rowCountry = (row.countryCode ?? row.location ?? '').toLowerCase();
      if (!rowCountry.includes(country)) {
        return false;
      }
    }
    if (theme && !(row.themes ?? []).some((value) => value.toLowerCase() === theme)) {
      return false;
    }
    if (platform && toPlatformLabel(row.source).toLowerCase() !== platform) {
      return false;
    }
    if (status && getStatus(row) !== status) {
      return false;
    }
    return true;
  });
}

server.listen(PORT, () => {
  console.info(`HackRadar API listening on http://localhost:${PORT}`);
});
