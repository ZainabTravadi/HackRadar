import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

// Classification enums used across hackathon ingestion and analytics.
export const modeEnum = pgEnum('mode_enum', ['online', 'in_person', 'hybrid', 'unknown']);
export const sourceEnum = pgEnum('source_enum', [
  'devpost',
  'mlh',
  'devfolio',
  'unstop',
  'dorahacks',
  'taikai',
  'hackerearth',
  'hack2skill',
  'reskilll',
  'lablab',
  'ethglobal',
  'angelhack',
  'hackclub',
  'university',
  'eventbrite',
  'luma',
  'meetup',
  'github',
  'reddit',
  'discord',
  'telegram',
  'linkedin',
  'twitter',
  'facebook',
  'google',
  'manual',
]);
export const statusEnum = pgEnum('status_enum', ['upcoming', 'open', 'closing_soon', 'ended']);
export const prizeTypeEnum = pgEnum('prize_type_enum', ['cash', 'non_cash', 'mixed', 'none', 'unknown']);
export const eligibilityEnum = pgEnum('eligibility_enum', ['open', 'student_only', 'invite_only', 'regional', 'unknown']);
export const queueStatusEnum = pgEnum('queue_status_enum', ['queued', 'processing', 'completed', 'failed', 'dead_letter']);
export const lockTypeEnum = pgEnum('lock_type_enum', ['scheduler', 'crawl']);
export const sourceClassificationEnum = pgEnum('source_classification_enum', ['PRIMARY', 'AGGREGATOR', 'DISCOVERY']);
export const sourceHealthEnum = pgEnum('source_health_enum', ['healthy', 'degraded', 'unhealthy']);

// Main entity for normalized hackathon records aggregated from multiple sources.
export const hackathons = pgTable(
  'hackathons',
  {
    // Identity
    id: uuid('id').defaultRandom().primaryKey(),
    sourceId: text('source_id').notNull(),
    source: sourceEnum('source').notNull(),
    sourceUrl: text('source_url').notNull(),

    // Core fields
    title: text('title').notNull(),
    slug: text('slug').notNull().unique(),
    description: text('description'),
    imageUrl: text('image_url'),
    organizerName: text('organizer_name'),

    // Dates
    registrationDeadline: timestamp('registration_deadline', { withTimezone: true }),
    submissionDeadline: timestamp('submission_deadline', { withTimezone: true }),
    startDate: timestamp('start_date', { withTimezone: true }),
    endDate: timestamp('end_date', { withTimezone: true }),

    // Classification
    mode: modeEnum('mode').notNull().default('unknown'),
    status: statusEnum('status').notNull().default('upcoming'),
    eligibility: eligibilityEnum('eligibility').notNull().default('unknown'),
    themes: text('themes').array().notNull().default(sql`'{}'::text[]`),
    countryCode: text('country_code'),
    location: text('location'),

    // Prize
    prizePool: real('prize_pool'),
    prizeType: prizeTypeEnum('prize_type').notNull().default('unknown'),
    prizeDescription: text('prize_description'),

    // Engagement
    participantCount: integer('participant_count'),

    // Deduplication
    canonicalId: uuid('canonical_id'),
    isDuplicate: boolean('is_duplicate').notNull().default(false),

    // Metadata
    scrapedAt: timestamp('scraped_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    rawData: text('raw_data'),
  },
  (table) => ({
    sourceSourceIdUniqueIdx: uniqueIndex('hackathons_source_source_id_unique_idx').on(table.source, table.sourceId),
    statusIdx: index('hackathons_status_idx').on(table.status),
    modeIdx: index('hackathons_mode_idx').on(table.mode),
    registrationDeadlineIdx: index('hackathons_registration_deadline_idx').on(table.registrationDeadline),
    sourceIdx: index('hackathons_source_idx').on(table.source),
    themesIdx: index('hackathons_themes_idx').on(table.themes),
  })
);

// Stores operational metrics for each scraping run.
export const scrapeLogs = pgTable('scrape_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  source: sourceEnum('source').notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  recordsFound: integer('records_found').notNull().default(0),
  recordsNew: integer('records_new').notNull().default(0),
  recordsUpdated: integer('records_updated').notNull().default(0),
  success: boolean('success').notNull().default(false),
  errorMessage: text('error_message'),
});

export const discoveryQueue = pgTable('discovery_queue', {
  id: uuid('id').defaultRandom().primaryKey(),
  source: text('source').notNull(),
  discoveredUrl: text('discovered_url').notNull(),
  canonicalUrl: text('canonical_url').notNull().unique(),
  ownerAdapter: text('owner_adapter').notNull(),
  status: queueStatusEnum('status').notNull().default('queued'),
  discoveredAt: timestamp('discovered_at', { withTimezone: true }).notNull().defaultNow(),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
});

// Primary crawl queue for scheduling source crawls
export const crawlQueue = pgTable('crawl_queue', {
  id: uuid('id').defaultRandom().primaryKey(),
  source: sourceEnum('source').notNull(),
  classification: sourceClassificationEnum('classification').notNull(),
  priority: integer('priority').notNull().default(0),
  status: queueStatusEnum('status').notNull().default('queued'),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull().defaultNow(),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  attempts: integer('attempts').notNull().default(0),
  maxAttempts: integer('max_attempts').notNull().default(3),
  lastError: text('last_error'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  sourceIdx: index('crawl_queue_source_idx').on(table.source),
  statusIdx: index('crawl_queue_status_idx').on(table.status),
  scheduledAtIdx: index('crawl_queue_scheduled_at_idx').on(table.scheduledAt),
}));

// Retry queue for failed crawl jobs with exponential backoff
export const retryQueue = pgTable('retry_queue', {
  id: uuid('id').defaultRandom().primaryKey(),
  crawlQueueId: uuid('crawl_queue_id').notNull().references(() => crawlQueue.id, { onDelete: 'cascade' }),
  source: sourceEnum('source').notNull(),
  attempt: integer('attempt').notNull(),
  maxAttempts: integer('max_attempts').notNull(),
  nextRetryAt: timestamp('next_retry_at', { withTimezone: true }).notNull(),
  backoffMs: integer('backoff_ms').notNull(),
  lastError: text('last_error'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  nextRetryAtIdx: index('retry_queue_next_retry_at_idx').on(table.nextRetryAt),
  sourceIdx: index('retry_queue_source_idx').on(table.source),
}));

// Dead letter queue for exhausted retries
export const deadLetterQueue = pgTable('dead_letter_queue', {
  id: uuid('id').defaultRandom().primaryKey(),
  crawlQueueId: uuid('crawl_queue_id').notNull().references(() => crawlQueue.id, { onDelete: 'cascade' }),
  source: sourceEnum('source').notNull(),
  attempts: integer('attempts').notNull(),
  maxAttempts: integer('max_attempts').notNull(),
  finalError: text('final_error'),
  payload: text('payload'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  sourceIdx: index('dead_letter_queue_source_idx').on(table.source),
  createdAtIdx: index('dead_letter_queue_created_at_idx').on(table.createdAt),
}));

// Distributed lock for scheduler coordination across Cloud Run instances
export const distributedLock = pgTable('distributed_lock', {
  id: uuid('id').defaultRandom().primaryKey(),
  lockType: lockTypeEnum('lock_type').notNull(),
  lockKey: text('lock_key').notNull().unique(),
  ownerId: text('owner_id').notNull(),
  acquiredAt: timestamp('acquired_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  metadata: text('metadata'),
}, (table) => ({
  lockTypeKeyIdx: uniqueIndex('distributed_lock_type_key_idx').on(table.lockType, table.lockKey),
  expiresAtIdx: index('distributed_lock_expires_at_idx').on(table.expiresAt),
}));

// Source interval configuration (configurable per source)
export const sourceIntervals = pgTable('source_intervals', {
  id: uuid('id').defaultRandom().primaryKey(),
  source: sourceEnum('source').notNull().unique(),
  intervalMinutes: integer('interval_minutes').notNull(),
  classification: sourceClassificationEnum('classification').notNull(),
  enabled: boolean('enabled').notNull().default(true),
  maxConcurrency: integer('max_concurrency').notNull().default(1),
  requestTimeoutMs: integer('request_timeout_ms').notNull().default(30000),
  retryMaxAttempts: integer('retry_max_attempts').notNull().default(3),
  retryBaseBackoffMs: integer('retry_base_backoff_ms').notNull().default(5000),
  healthThresholdFailures: integer('health_threshold_failures').notNull().default(3),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  sourceIdx: uniqueIndex('source_intervals_source_idx').on(table.source),
}));

// Incremental crawl state tracking per source
export const crawlState = pgTable('crawl_state', {
  id: uuid('id').defaultRandom().primaryKey(),
  source: sourceEnum('source').notNull().unique(),
  lastCrawledAt: timestamp('last_crawled_at', { withTimezone: true }),
  lastSuccessfulCrawlAt: timestamp('last_successful_crawl_at', { withTimezone: true }),
  contentHash: text('content_hash'),
  etag: text('etag'),
  lastModified: timestamp('last_modified', { withTimezone: true }),
  consecutiveFailures: integer('consecutive_failures').notNull().default(0),
  totalCrawls: integer('total_crawls').notNull().default(0),
  totalSuccesses: integer('total_successes').notNull().default(0),
  totalFailures: integer('total_failures').notNull().default(0),
  health: sourceHealthEnum('health').notNull().default('healthy'),
  lastError: text('last_error'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  sourceIdx: uniqueIndex('crawl_state_source_idx').on(table.source),
}));

// Metrics collection for observability
export const crawlerMetrics = pgTable('crawler_metrics', {
  id: uuid('id').defaultRandom().primaryKey(),
  source: sourceEnum('source').notNull(),
  crawlType: text('crawl_type').notNull(), // 'discovery', 'primary', 'incremental'
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  durationMs: integer('duration_ms'),
  requests: integer('requests').notNull().default(0),
  avgResponseTimeMs: integer('avg_response_time_ms'),
  itemsFound: integer('items_found').notNull().default(0),
  itemsNew: integer('items_new').notNull().default(0),
  itemsUpdated: integer('items_updated').notNull().default(0),
  duplicates: integer('duplicates').notNull().default(0),
  rejected: integer('rejected').notNull().default(0),
  validationFailures: integer('validation_failures').notNull().default(0),
  retryCount: integer('retry_count').notNull().default(0),
  failureCount: integer('failure_count').notNull().default(0),
  success: boolean('success').notNull().default(false),
  errorMessage: text('error_message'),
  skipped: boolean('skipped').notNull().default(false),
  skipReason: text('skip_reason'),
}, (table) => ({
  sourceIdx: index('crawler_metrics_source_idx').on(table.source),
  startedAtIdx: index('crawler_metrics_started_at_idx').on(table.startedAt),
  crawlTypeIdx: index('crawler_metrics_crawl_type_idx').on(table.crawlType),
}));

// Cache refresh status tracking
export const cacheRefreshStatus = pgTable('cache_refresh_status', {
  id: uuid('id').defaultRandom().primaryKey(),
  cacheType: text('cache_type').notNull().unique(), // 'statistics', 'homepage_counters', 'search_cache', 'aggregated_filters'
  lastRefreshedAt: timestamp('last_refreshed_at', { withTimezone: true }).notNull().defaultNow(),
  lastSuccessfulAt: timestamp('last_successful_at', { withTimezone: true }),
  status: text('status').notNull().default('pending'), // 'pending', 'refreshing', 'completed', 'failed'
  errorMessage: text('error_message'),
  itemsRefreshed: integer('items_refreshed').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  cacheTypeIdx: uniqueIndex('cache_refresh_status_cache_type_idx').on(table.cacheType),
}));

export type Hackathon = typeof hackathons.$inferSelect;
export type NewHackathon = typeof hackathons.$inferInsert;
export type ScrapeLog = typeof scrapeLogs.$inferSelect;

// Initiative applications table (Phase 3)
export const initiativeApplications = pgTable('initiative_applications', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  githubUsername: text('github_username'),
  linkedinUrl: text('linkedin_url'),
  websiteUrl: text('website_url'),
  interests: text('interests').array().notNull().default(sql`'{}'::text[]`),
  contributionAreas: text('contribution_areas').array().notNull().default(sql`'{}'::text[]`),
  experienceLevel: text('experience_level'),
  availability: text('availability'),
  contributionTypes: text('contribution_types').array().notNull().default(sql`'{}'::text[]`),
  motivation: text('motivation'),
  status: text('status').notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  createdAtIdx: index('initiative_applications_created_at_idx').on(t.createdAt),
}));

export type InitiativeApplication = typeof initiativeApplications.$inferSelect;
export type NewInitiativeApplication = typeof initiativeApplications.$inferInsert;
