CREATE TABLE `company_profile` (
	`id` integer PRIMARY KEY NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`name` text NOT NULL,
	`uei` text NOT NULL,
	`cage_code` text,
	`naics_codes` text NOT NULL,
	`certifications` text NOT NULL,
	`capabilities` text NOT NULL,
	`contact_name` text NOT NULL,
	`contact_email` text NOT NULL,
	`contact_phone` text,
	`updated_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `cron_runs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`started_at` integer NOT NULL,
	`finished_at` integer,
	`status` text NOT NULL,
	`opps_fetched` integer DEFAULT 0 NOT NULL,
	`opps_new` integer DEFAULT 0 NOT NULL,
	`opps_scored` integer DEFAULT 0 NOT NULL,
	`total_cost_usd` real DEFAULT 0 NOT NULL,
	`cost_cap_usd` real NOT NULL,
	`error_summary` text,
	`logs` text DEFAULT ('[]') NOT NULL
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`opportunity_id` text,
	`kind` text NOT NULL,
	`markdown_source` text NOT NULL,
	`pdf_path` text NOT NULL,
	`model` text NOT NULL,
	`prompt_tokens` integer NOT NULL,
	`completion_tokens` integer NOT NULL,
	`cost_usd` real NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`opportunity_id`) REFERENCES `opportunities`(`notice_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `opportunities` (
	`notice_id` text PRIMARY KEY NOT NULL,
	`raw_json` text NOT NULL,
	`title` text NOT NULL,
	`agency` text NOT NULL,
	`naics` text,
	`set_aside` text,
	`posted_at` integer,
	`response_deadline` integer,
	`award_ceiling` integer,
	`place_of_performance` text,
	`description` text,
	`first_seen_at` integer NOT NULL,
	`last_synced_at` integer NOT NULL,
	`status` text DEFAULT 'new' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `scores` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`opportunity_id` text NOT NULL,
	`profile_version` integer NOT NULL,
	`fit_score` integer NOT NULL,
	`recommendation` text NOT NULL,
	`naics_match` text NOT NULL,
	`capability_match` text NOT NULL,
	`setaside_match` text NOT NULL,
	`key_requirements` text NOT NULL,
	`risks` text NOT NULL,
	`win_themes` text NOT NULL,
	`model` text NOT NULL,
	`prompt_tokens` integer NOT NULL,
	`completion_tokens` integer NOT NULL,
	`cost_usd` real NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`opportunity_id`) REFERENCES `opportunities`(`notice_id`) ON UPDATE no action ON DELETE no action
);
