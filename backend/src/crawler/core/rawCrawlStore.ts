import { db } from '../../db';
import { sql } from 'drizzle-orm';

export interface RawCrawlRecord {
  source: string;
  url: string;
  html?: string | null;
  json?: string | null;
  headers?: Record<string, string> | null;
  statusCode?: number | null;
  responseTimeMs?: number | null;
  timestamp?: string | null;
}

export async function storeRawCrawl(record: RawCrawlRecord): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS raw_crawls (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      source TEXT NOT NULL,
      url TEXT NOT NULL,
      html TEXT,
      json TEXT,
      headers JSONB,
      status_code INTEGER,
      response_time_ms INTEGER,
      timestamp TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    INSERT INTO raw_crawls (source, url, html, json, headers, status_code, response_time_ms, timestamp)
    VALUES (${record.source}, ${record.url}, ${record.html ?? null}, ${record.json ?? null}, ${JSON.stringify(record.headers ?? {})}, ${record.statusCode ?? null}, ${record.responseTimeMs ?? null}, ${record.timestamp ?? new Date().toISOString()})
  `);
}
