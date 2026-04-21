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
export const sourceEnum = pgEnum('source_enum', ['devpost', 'mlh', 'unstop', 'devfolio', 'manual']);
export const statusEnum = pgEnum('status_enum', ['upcoming', 'open', 'closing_soon', 'ended']);
export const prizeTypeEnum = pgEnum('prize_type_enum', ['cash', 'non_cash', 'mixed', 'none', 'unknown']);
export const eligibilityEnum = pgEnum('eligibility_enum', ['open', 'student_only', 'invite_only', 'regional', 'unknown']);

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

export type Hackathon = typeof hackathons.$inferSelect;
export type NewHackathon = typeof hackathons.$inferInsert;
export type ScrapeLog = typeof scrapeLogs.$inferSelect;