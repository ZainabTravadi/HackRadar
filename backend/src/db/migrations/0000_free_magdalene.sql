CREATE TYPE "public"."eligibility_enum" AS ENUM('open', 'student_only', 'invite_only', 'regional', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."lock_type_enum" AS ENUM('scheduler', 'crawl');--> statement-breakpoint
CREATE TYPE "public"."mode_enum" AS ENUM('online', 'in_person', 'hybrid', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."prize_type_enum" AS ENUM('cash', 'non_cash', 'mixed', 'none', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."queue_status_enum" AS ENUM('queued', 'processing', 'completed', 'failed', 'dead_letter');--> statement-breakpoint
CREATE TYPE "public"."source_classification_enum" AS ENUM('PRIMARY', 'AGGREGATOR', 'DISCOVERY');--> statement-breakpoint
CREATE TYPE "public"."source_enum" AS ENUM('devpost', 'mlh', 'devfolio', 'unstop', 'dorahacks', 'taikai', 'hackerearth', 'hack2skill', 'reskilll', 'lablab', 'ethglobal', 'angelhack', 'hackclub', 'university', 'eventbrite', 'luma', 'meetup', 'github', 'reddit', 'discord', 'telegram', 'linkedin', 'twitter', 'facebook', 'google', 'manual');--> statement-breakpoint
CREATE TYPE "public"."source_health_enum" AS ENUM('healthy', 'degraded', 'unhealthy');--> statement-breakpoint
CREATE TYPE "public"."status_enum" AS ENUM('upcoming', 'open', 'closing_soon', 'ended');--> statement-breakpoint
CREATE TABLE "cache_refresh_status" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cache_type" text NOT NULL,
	"last_refreshed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_successful_at" timestamp with time zone,
	"status" text DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"items_refreshed" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cache_refresh_status_cache_type_unique" UNIQUE("cache_type")
);
--> statement-breakpoint
CREATE TABLE "crawl_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" "source_enum" NOT NULL,
	"classification" "source_classification_enum" NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"status" "queue_status_enum" DEFAULT 'queued' NOT NULL,
	"scheduled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 3 NOT NULL,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crawl_state" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" "source_enum" NOT NULL,
	"last_crawled_at" timestamp with time zone,
	"last_successful_crawl_at" timestamp with time zone,
	"content_hash" text,
	"etag" text,
	"last_modified" timestamp with time zone,
	"consecutive_failures" integer DEFAULT 0 NOT NULL,
	"total_crawls" integer DEFAULT 0 NOT NULL,
	"total_successes" integer DEFAULT 0 NOT NULL,
	"total_failures" integer DEFAULT 0 NOT NULL,
	"health" "source_health_enum" DEFAULT 'healthy' NOT NULL,
	"last_error" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "crawl_state_source_unique" UNIQUE("source")
);
--> statement-breakpoint
CREATE TABLE "crawler_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" "source_enum" NOT NULL,
	"crawl_type" text NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"duration_ms" integer,
	"requests" integer DEFAULT 0 NOT NULL,
	"avg_response_time_ms" integer,
	"items_found" integer DEFAULT 0 NOT NULL,
	"items_new" integer DEFAULT 0 NOT NULL,
	"items_updated" integer DEFAULT 0 NOT NULL,
	"duplicates" integer DEFAULT 0 NOT NULL,
	"rejected" integer DEFAULT 0 NOT NULL,
	"validation_failures" integer DEFAULT 0 NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"failure_count" integer DEFAULT 0 NOT NULL,
	"success" boolean DEFAULT false NOT NULL,
	"error_message" text,
	"skipped" boolean DEFAULT false NOT NULL,
	"skip_reason" text
);
--> statement-breakpoint
CREATE TABLE "dead_letter_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"crawl_queue_id" uuid NOT NULL,
	"source" "source_enum" NOT NULL,
	"attempts" integer NOT NULL,
	"max_attempts" integer NOT NULL,
	"final_error" text,
	"payload" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discovery_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" text NOT NULL,
	"discovered_url" text NOT NULL,
	"canonical_url" text NOT NULL,
	"owner_adapter" text NOT NULL,
	"status" "queue_status_enum" DEFAULT 'queued' NOT NULL,
	"discovered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "discovery_queue_canonical_url_unique" UNIQUE("canonical_url")
);
--> statement-breakpoint
CREATE TABLE "distributed_lock" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lock_type" "lock_type_enum" NOT NULL,
	"lock_key" text NOT NULL,
	"owner_id" text NOT NULL,
	"acquired_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"metadata" text,
	CONSTRAINT "distributed_lock_lock_key_unique" UNIQUE("lock_key")
);
--> statement-breakpoint
CREATE TABLE "hackathons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" text NOT NULL,
	"source" "source_enum" NOT NULL,
	"source_url" text NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"image_url" text,
	"organizer_name" text,
	"registration_deadline" timestamp with time zone,
	"submission_deadline" timestamp with time zone,
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"mode" "mode_enum" DEFAULT 'unknown' NOT NULL,
	"status" "status_enum" DEFAULT 'upcoming' NOT NULL,
	"eligibility" "eligibility_enum" DEFAULT 'unknown' NOT NULL,
	"themes" text[] DEFAULT '{}'::text[] NOT NULL,
	"country_code" text,
	"location" text,
	"prize_pool" real,
	"prize_type" "prize_type_enum" DEFAULT 'unknown' NOT NULL,
	"prize_description" text,
	"participant_count" integer,
	"canonical_id" uuid,
	"is_duplicate" boolean DEFAULT false NOT NULL,
	"scraped_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"raw_data" text,
	CONSTRAINT "hackathons_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "retry_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"crawl_queue_id" uuid NOT NULL,
	"source" "source_enum" NOT NULL,
	"attempt" integer NOT NULL,
	"max_attempts" integer NOT NULL,
	"next_retry_at" timestamp with time zone NOT NULL,
	"backoff_ms" integer NOT NULL,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scrape_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" "source_enum" NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"records_found" integer DEFAULT 0 NOT NULL,
	"records_new" integer DEFAULT 0 NOT NULL,
	"records_updated" integer DEFAULT 0 NOT NULL,
	"success" boolean DEFAULT false NOT NULL,
	"error_message" text
);
--> statement-breakpoint
CREATE TABLE "source_intervals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" "source_enum" NOT NULL,
	"interval_minutes" integer NOT NULL,
	"classification" "source_classification_enum" NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"max_concurrency" integer DEFAULT 1 NOT NULL,
	"request_timeout_ms" integer DEFAULT 30000 NOT NULL,
	"retry_max_attempts" integer DEFAULT 3 NOT NULL,
	"retry_base_backoff_ms" integer DEFAULT 5000 NOT NULL,
	"health_threshold_failures" integer DEFAULT 3 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "source_intervals_source_unique" UNIQUE("source")
);
--> statement-breakpoint
ALTER TABLE "dead_letter_queue" ADD CONSTRAINT "dead_letter_queue_crawl_queue_id_crawl_queue_id_fk" FOREIGN KEY ("crawl_queue_id") REFERENCES "public"."crawl_queue"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retry_queue" ADD CONSTRAINT "retry_queue_crawl_queue_id_crawl_queue_id_fk" FOREIGN KEY ("crawl_queue_id") REFERENCES "public"."crawl_queue"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "cache_refresh_status_cache_type_idx" ON "cache_refresh_status" USING btree ("cache_type");--> statement-breakpoint
CREATE INDEX "crawl_queue_source_idx" ON "crawl_queue" USING btree ("source");--> statement-breakpoint
CREATE INDEX "crawl_queue_status_idx" ON "crawl_queue" USING btree ("status");--> statement-breakpoint
CREATE INDEX "crawl_queue_scheduled_at_idx" ON "crawl_queue" USING btree ("scheduled_at");--> statement-breakpoint
CREATE UNIQUE INDEX "crawl_state_source_idx" ON "crawl_state" USING btree ("source");--> statement-breakpoint
CREATE INDEX "crawler_metrics_source_idx" ON "crawler_metrics" USING btree ("source");--> statement-breakpoint
CREATE INDEX "crawler_metrics_started_at_idx" ON "crawler_metrics" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "crawler_metrics_crawl_type_idx" ON "crawler_metrics" USING btree ("crawl_type");--> statement-breakpoint
CREATE INDEX "dead_letter_queue_source_idx" ON "dead_letter_queue" USING btree ("source");--> statement-breakpoint
CREATE INDEX "dead_letter_queue_created_at_idx" ON "dead_letter_queue" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "distributed_lock_type_key_idx" ON "distributed_lock" USING btree ("lock_type","lock_key");--> statement-breakpoint
CREATE INDEX "distributed_lock_expires_at_idx" ON "distributed_lock" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "hackathons_source_source_id_unique_idx" ON "hackathons" USING btree ("source","source_id");--> statement-breakpoint
CREATE INDEX "hackathons_status_idx" ON "hackathons" USING btree ("status");--> statement-breakpoint
CREATE INDEX "hackathons_mode_idx" ON "hackathons" USING btree ("mode");--> statement-breakpoint
CREATE INDEX "hackathons_registration_deadline_idx" ON "hackathons" USING btree ("registration_deadline");--> statement-breakpoint
CREATE INDEX "hackathons_source_idx" ON "hackathons" USING btree ("source");--> statement-breakpoint
CREATE INDEX "hackathons_themes_idx" ON "hackathons" USING btree ("themes");--> statement-breakpoint
CREATE INDEX "retry_queue_next_retry_at_idx" ON "retry_queue" USING btree ("next_retry_at");--> statement-breakpoint
CREATE INDEX "retry_queue_source_idx" ON "retry_queue" USING btree ("source");--> statement-breakpoint
CREATE UNIQUE INDEX "source_intervals_source_idx" ON "source_intervals" USING btree ("source");