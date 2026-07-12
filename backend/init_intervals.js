const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://neondb_owner:npg_q1Awuxd8fMQt@ep-restless-cherry-ancgn6mh-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require', ssl: { rejectUnauthorized: false } });

const defaults = {
  devpost: { intervalMinutes: 5, classification: 'PRIMARY', enabled: true, maxConcurrency: 1, requestTimeoutMs: 30000, retryMaxAttempts: 3, retryBaseBackoffMs: 5000, healthThresholdFailures: 3 },
  mlh: { intervalMinutes: 10, classification: 'PRIMARY', enabled: true, maxConcurrency: 1, requestTimeoutMs: 30000, retryMaxAttempts: 3, retryBaseBackoffMs: 5000, healthThresholdFailures: 3 },
  devfolio: { intervalMinutes: 10, classification: 'PRIMARY', enabled: true, maxConcurrency: 1, requestTimeoutMs: 30000, retryMaxAttempts: 3, retryBaseBackoffMs: 5000, healthThresholdFailures: 3 },
  unstop: { intervalMinutes: 10, classification: 'PRIMARY', enabled: true, maxConcurrency: 1, requestTimeoutMs: 30000, retryMaxAttempts: 3, retryBaseBackoffMs: 5000, healthThresholdFailures: 3 },
  dorahacks: { intervalMinutes: 10, classification: 'PRIMARY', enabled: true, maxConcurrency: 1, requestTimeoutMs: 30000, retryMaxAttempts: 3, retryBaseBackoffMs: 5000, healthThresholdFailures: 3 },
  taikai: { intervalMinutes: 10, classification: 'PRIMARY', enabled: true, maxConcurrency: 1, requestTimeoutMs: 30000, retryMaxAttempts: 3, retryBaseBackoffMs: 5000, healthThresholdFailures: 3 },
  hackerearth: { intervalMinutes: 10, classification: 'PRIMARY', enabled: true, maxConcurrency: 1, requestTimeoutMs: 30000, retryMaxAttempts: 3, retryBaseBackoffMs: 5000, healthThresholdFailures: 3 },
  hack2skill: { intervalMinutes: 10, classification: 'PRIMARY', enabled: true, maxConcurrency: 1, requestTimeoutMs: 30000, retryMaxAttempts: 3, retryBaseBackoffMs: 5000, healthThresholdFailures: 3 },
  reskilll: { intervalMinutes: 10, classification: 'PRIMARY', enabled: true, maxConcurrency: 1, requestTimeoutMs: 30000, retryMaxAttempts: 3, retryBaseBackoffMs: 5000, healthThresholdFailures: 3 },
  ethglobal: { intervalMinutes: 15, classification: 'PRIMARY', enabled: true, maxConcurrency: 1, requestTimeoutMs: 30000, retryMaxAttempts: 3, retryBaseBackoffMs: 5000, healthThresholdFailures: 3 },
  lablab: { intervalMinutes: 10, classification: 'PRIMARY', enabled: true, maxConcurrency: 1, requestTimeoutMs: 30000, retryMaxAttempts: 3, retryBaseBackoffMs: 5000, healthThresholdFailures: 3 },
  angelhack: { intervalMinutes: 15, classification: 'PRIMARY', enabled: true, maxConcurrency: 1, requestTimeoutMs: 30000, retryMaxAttempts: 3, retryBaseBackoffMs: 5000, healthThresholdFailures: 3 },
  hackclub: { intervalMinutes: 30, classification: 'AGGREGATOR', enabled: true, maxConcurrency: 1, requestTimeoutMs: 30000, retryMaxAttempts: 3, retryBaseBackoffMs: 5000, healthThresholdFailures: 3 },
  university: { intervalMinutes: 30, classification: 'AGGREGATOR', enabled: true, maxConcurrency: 1, requestTimeoutMs: 30000, retryMaxAttempts: 3, retryBaseBackoffMs: 5000, healthThresholdFailures: 3 },
  eventbrite: { intervalMinutes: 30, classification: 'AGGREGATOR', enabled: true, maxConcurrency: 1, requestTimeoutMs: 30000, retryMaxAttempts: 3, retryBaseBackoffMs: 5000, healthThresholdFailures: 3 },
  meetup: { intervalMinutes: 30, classification: 'AGGREGATOR', enabled: true, maxConcurrency: 1, requestTimeoutMs: 30000, retryMaxAttempts: 3, retryBaseBackoffMs: 5000, healthThresholdFailures: 3 },
  luma: { intervalMinutes: 30, classification: 'AGGREGATOR', enabled: true, maxConcurrency: 1, requestTimeoutMs: 30000, retryMaxAttempts: 3, retryBaseBackoffMs: 5000, healthThresholdFailures: 3 },
  github: { intervalMinutes: 60, classification: 'DISCOVERY', enabled: true, maxConcurrency: 1, requestTimeoutMs: 30000, retryMaxAttempts: 3, retryBaseBackoffMs: 5000, healthThresholdFailures: 3 },
  reddit: { intervalMinutes: 60, classification: 'DISCOVERY', enabled: true, maxConcurrency: 1, requestTimeoutMs: 30000, retryMaxAttempts: 3, retryBaseBackoffMs: 5000, healthThresholdFailures: 3 },
  discord: { intervalMinutes: 60, classification: 'DISCOVERY', enabled: true, maxConcurrency: 1, requestTimeoutMs: 30000, retryMaxAttempts: 3, retryBaseBackoffMs: 5000, healthThresholdFailures: 3 },
  telegram: { intervalMinutes: 60, classification: 'DISCOVERY', enabled: true, maxConcurrency: 1, requestTimeoutMs: 30000, retryMaxAttempts: 3, retryBaseBackoffMs: 5000, healthThresholdFailures: 3 },
  linkedin: { intervalMinutes: 60, classification: 'DISCOVERY', enabled: true, maxConcurrency: 1, requestTimeoutMs: 30000, retryMaxAttempts: 3, retryBaseBackoffMs: 5000, healthThresholdFailures: 3 },
  twitter: { intervalMinutes: 60, classification: 'DISCOVERY', enabled: true, maxConcurrency: 1, requestTimeoutMs: 30000, retryMaxAttempts: 3, retryBaseBackoffMs: 5000, healthThresholdFailures: 3 },
  facebook: { intervalMinutes: 60, classification: 'DISCOVERY', enabled: true, maxConcurrency: 1, requestTimeoutMs: 30000, retryMaxAttempts: 3, retryBaseBackoffMs: 5000, healthThresholdFailures: 3 },
  google: { intervalMinutes: 60, classification: 'DISCOVERY', enabled: true, maxConcurrency: 1, requestTimeoutMs: 30000, retryMaxAttempts: 3, retryBaseBackoffMs: 5000, healthThresholdFailures: 3 },
};

async function init() {
  for (const [source, config] of Object.entries(defaults)) {
    await pool.query(
      `INSERT INTO source_intervals (source, interval_minutes, classification, enabled, max_concurrency, request_timeout_ms, retry_max_attempts, retry_base_backoff_ms, health_threshold_failures)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (source) DO UPDATE SET
         interval_minutes = EXCLUDED.interval_minutes,
         classification = EXCLUDED.classification,
         enabled = EXCLUDED.enabled,
         max_concurrency = EXCLUDED.max_concurrency,
         request_timeout_ms = EXCLUDED.request_timeout_ms,
         retry_max_attempts = EXCLUDED.retry_max_attempts,
         retry_base_backoff_ms = EXCLUDED.retry_base_backoff_ms,
         health_threshold_failures = EXCLUDED.health_threshold_failures,
         updated_at = NOW()`,
      [source, config.intervalMinutes, config.classification, config.enabled, config.maxConcurrency, config.requestTimeoutMs, config.retryMaxAttempts, config.retryBaseBackoffMs, config.healthThresholdFailures]
    );
    console.log('Initialized:', source);
  }
  await pool.end();
  console.log('Done');
}

init().catch(e => { console.error(e); pool.end(); process.exit(1); });