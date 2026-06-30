import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const companyProfile = sqliteTable('company_profile', {
  id: integer('id').primaryKey({ autoIncrement: false }),
  version: integer('version').notNull().default(1),
  name: text('name').notNull(),
  uei: text('uei').notNull(),
  cageCode: text('cage_code'),
  naicsCodes: text('naics_codes', { mode: 'json' }).$type<string[]>().notNull(),
  certifications: text('certifications', { mode: 'json' }).$type<string[]>().notNull(),
  capabilities: text('capabilities').notNull(),
  contactName: text('contact_name').notNull(),
  contactEmail: text('contact_email').notNull(),
  contactPhone: text('contact_phone'),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(strftime('%s','now') * 1000)`),
});

export const opportunities = sqliteTable('opportunities', {
  noticeId: text('notice_id').primaryKey(),
  rawJson: text('raw_json', { mode: 'json' }).$type<Record<string, unknown>>().notNull(),
  title: text('title').notNull(),
  agency: text('agency').notNull(),
  naics: text('naics'),
  setAside: text('set_aside'),
  postedAt: integer('posted_at', { mode: 'timestamp_ms' }),
  responseDeadline: integer('response_deadline', { mode: 'timestamp_ms' }),
  awardCeiling: integer('award_ceiling'),
  placeOfPerformance: text('place_of_performance'),
  description: text('description'),
  firstSeenAt: integer('first_seen_at', { mode: 'timestamp_ms' }).notNull(),
  lastSyncedAt: integer('last_synced_at', { mode: 'timestamp_ms' }).notNull(),
  status: text('status', { enum: ['new', 'reviewed', 'shortlisted', 'bidding', 'submitted', 'passed'] })
    .notNull()
    .default('new'),
});

export const scores = sqliteTable('scores', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  opportunityId: text('opportunity_id').notNull().references(() => opportunities.noticeId),
  profileVersion: integer('profile_version').notNull(),
  fitScore: integer('fit_score').notNull(),
  recommendation: text('recommendation', { enum: ['GO', 'NO_GO', 'MAYBE'] }).notNull(),
  naicsMatch: text('naics_match', { mode: 'json' }).$type<{ matched: boolean; reason: string }>().notNull(),
  capabilityMatch: text('capability_match', { mode: 'json' }).$type<{ matched: boolean; reason: string }>().notNull(),
  setasideMatch: text('setaside_match', { mode: 'json' }).$type<{ matched: boolean; reason: string }>().notNull(),
  keyRequirements: text('key_requirements', { mode: 'json' }).$type<string[]>().notNull(),
  risks: text('risks', { mode: 'json' }).$type<string[]>().notNull(),
  winThemes: text('win_themes', { mode: 'json' }).$type<string[]>().notNull(),
  model: text('model').notNull(),
  promptTokens: integer('prompt_tokens').notNull(),
  completionTokens: integer('completion_tokens').notNull(),
  costUsd: real('cost_usd').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  confidence: real('confidence'),
  confidenceReason: text('confidence_reason'),
  ambiguity: text('ambiguity'),
});

export const documents = sqliteTable('documents', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  opportunityId: text('opportunity_id').references(() => opportunities.noticeId),
  kind: text('kind', { enum: ['capability', 'analysis', 'proposal', 'compliance_matrix'] }).notNull(),
  markdownSource: text('markdown_source').notNull(),
  pdfPath: text('pdf_path').notNull(),
  model: text('model').notNull(),
  promptTokens: integer('prompt_tokens').notNull(),
  completionTokens: integer('completion_tokens').notNull(),
  costUsd: real('cost_usd').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});

export const cronRuns = sqliteTable('cron_runs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  startedAt: integer('started_at', { mode: 'timestamp_ms' }).notNull(),
  finishedAt: integer('finished_at', { mode: 'timestamp_ms' }),
  status: text('status', { enum: ['ok', 'partial', 'failed', 'running'] }).notNull(),
  oppsFetched: integer('opps_fetched').notNull().default(0),
  oppsNew: integer('opps_new').notNull().default(0),
  oppsScored: integer('opps_scored').notNull().default(0),
  totalCostUsd: real('total_cost_usd').notNull().default(0),
  costCapUsd: real('cost_cap_usd').notNull(),
  errorSummary: text('error_summary'),
  logs: text('logs', { mode: 'json' }).$type<Array<{ ts: number; level: string; msg: string; ctx?: unknown }>>().notNull().default(sql`('[]')`),
});

export type CompanyProfile = typeof companyProfile.$inferSelect;
export type NewCompanyProfile = typeof companyProfile.$inferInsert;
export type Opportunity = typeof opportunities.$inferSelect;
export type NewOpportunity = typeof opportunities.$inferInsert;
export type Score = typeof scores.$inferSelect;
export type NewScore = typeof scores.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
export type CronRun = typeof cronRuns.$inferSelect;
export type NewCronRun = typeof cronRuns.$inferInsert;
