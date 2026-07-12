CREATE TABLE IF NOT EXISTS cache_refresh_status (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	cache_type text NOT NULL,
	last_refreshed_at timestamp with time zone DEFAULT now() NOT NULL,
	last_successful_at timestamp with time zone,
	status text DEFAULT 'pending' NOT NULL,
	error_message text,
	items_refreshed integer DEFAULT 0 NOT NULL,
	updated_at timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT cache_refresh_status_cache_type_unique UNIQUE(cache_type)
);

CREATE TABLE IF NOT EXISTS crawl_queue (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	source source_enum NOT NULL,
	classification source_classification_enum NOT NULL,
	priority integer DEFAULT 0 NOT NULL,
	status queue_status_enum DEFAULT 'queued' NOT NULL,
	scheduled_at timestamp with time zone DEFAULT now() NOT NULL,
	started_at timestamp with time zone,
	completed_at timestamp with time zone,
	attempts integer DEFAULT 0 NOT NULL,
	max_attempts integer DEFAULT 3 NOT NULL,
	last_error text,
	created_at timestamp with time zone DEFAULT now() NOT NULL,
	updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS crawl_state (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	source source_enum NOT NULL,
	last_crawled_at timestamp with time zone,
	last_successful_crawl_at timestamp with time zone,
	content_hash text,
	etag text,
	last_modified timestamp with time zone,
	consecutive_failures integer DEFAULT 0 NOT NULL,
	total_crawls integer DEFAULT 0 NOT NULL,
	total_successes integer DEFAULT 0 NOT NULL,
	total_failures integer DEFAULT 0 NOT NULL,
	health source_health_enum DEFAULT 'healthy' NOT NULL,
	last_error text,
	updated_at timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT crawl_state_source_unique UNIQUE(source)
);

CREATE TABLE IF NOT EXISTS crawler_metrics (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	source source_enum NOT NULL,
	crawl_type text NOT NULL,
	started_at timestamp with time zone DEFAULT now() NOT NULL,
	completed_at timestamp with time zone,
	duration_ms integer,
	requests integer DEFAULT 0 NOT NULL,
	avg_response_time_ms integer,
	items_found integer DEFAULT 0 NOT NULL,
	items_new integer DEFAULT 0 NOT NULL,
	items_updated integer DEFAULT 0 NOT NULL,
	duplicates integer DEFAULT 0 NOT NULL,
	rejected integer DEFAULT 0 NOT NULL,
	validation_failures integer DEFAULT 0 NOT NULL,
	retry_count integer DEFAULT 0 NOT NULL,
	failure_count integer DEFAULT 0 NOT NULL,
	success boolean DEFAULT false NOT NULL,
	error_message text,
	skipped boolean DEFAULT false NOT NULL,
	skip_reason text
);

CREATE TABLE IF NOT EXISTS dead_letter_queue (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	crawl_queue_id uuid NOT NULL,
	source source_enum NOT NULL,
	attempts integer NOT NULL,
	max_attempts integer NOT NULL,
	final_error text,
	payload text,
	created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS discovery_queue (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	source text NOT NULL,
	discovered_url text NOT NULL,
	canonical_url text NOT NULL,
	owner_adapter text NOT NULL,
	status queue_status_enum DEFAULT 'queued' NOT NULL,
	discovered_at timestamp with time zone DEFAULT now() NOT NULL,
	last_seen_at timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT discovery_queue_canonical_url_unique UNIQUE(canonical_url)
);

CREATE TABLE IF NOT EXISTS distributed_lock (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	lock_type lock_type_enum NOT NULL,
	lock_key text NOT NULL,
	owner_id text NOT NULL,
	acquired_at timestamp with time zone DEFAULT now() NOT NULL,
	expires_at timestamp with time zone NOT NULL,
	metadata text,
	CONSTRAINT distributed_lock_lock_key_unique UNIQUE(lock_key)
);

CREATE TABLE IF NOT EXISTS retry_queue (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	crawl_queue_id uuid NOT NULL,
	source source_enum NOT NULL,
	attempt integer NOT NULL,
	max_attempts integer NOT NULL,
	next_retry_at timestamp with time zone NOT NULL,
	backoff_ms integer NOT NULL,
	last_error text,
	created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS source_intervals (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	source source_enum NOT NULL,
	interval_minutes integer NOT NULL,
	classification source_classification_enum NOT NULL,
	enabled boolean DEFAULT true NOT NULL,
	max_concurrency integer DEFAULT 1 NOT NULL,
	request_timeout_ms integer DEFAULT 30000 NOT NULL,
	retry_max_attempts integer DEFAULT 3 NOT NULL,
	retry_base_backoff_ms integer DEFAULT 5000 NOT NULL,
	health_threshold_failures integer DEFAULT 3 NOT NULL,
	created_at timestamp with time zone DEFAULT now() NOT NULL,
	updated_at timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT source_intervals_source_unique UNIQUE(source)
);