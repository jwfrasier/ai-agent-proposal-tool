# GovContracts Dashboard Rebuild — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the GovContracts Dashboard from scratch as a single-user Next.js 16 app on Fly.io with SQLite, a daily cron-driven scoring pipeline using Claude Sonnet 4.6, and PDF document generation — replacing the audit-failing prior implementation.

**Architecture:** One Next.js 16 app on a single Fly machine. SQLite via better-sqlite3 + Drizzle. External GitHub Actions cron hits a guarded HTTP endpoint daily; pipeline searches SAM.gov, scores opportunities with Claude (tool-use structured output), persists to DB. UI reads only from DB. Documents are generated as Markdown then rendered to PDF.

**Tech Stack:** Next.js 16, React 19, TypeScript strict, better-sqlite3 + Drizzle ORM, Anthropic SDK, zod, Tailwind v4 + shadcn/ui, pino, vitest, @react-pdf/renderer + marked.

**Reference:** Design spec at `docs/superpowers/specs/2026-05-21-govcontracts-rebuild-design.md`.

**Branch strategy:** Work on `rebuild` branch. The first task deletes legacy code; the branch will not build until Task 4 (config + db scaffold) lands. Do not merge to main until Task 26.

---

## File Map

**Created:**
- `lib/config.ts`, `lib/log.ts`
- `lib/db/schema.ts`, `lib/db/client.ts`, `lib/db/migrate.ts`, `lib/db/migrations/*`
- `drizzle.config.ts`
- `lib/sam/client.ts`, `lib/sam/search.ts`, `lib/sam/schemas.ts`
- `lib/ai/client.ts`, `lib/ai/score.ts`, `lib/ai/docs.ts`, `lib/ai/schemas.ts`
- `lib/docs/render.ts`, `lib/docs/templates/capability.md`
- `lib/pipeline/daily-run.ts`, `lib/pipeline/heuristic.ts`
- `app/api/profile/route.ts`
- `app/api/opportunities/route.ts`, `app/api/opportunities/[id]/route.ts`
- `app/api/opportunities/[id]/score/route.ts`, `app/api/opportunities/[id]/docs/route.ts`
- `app/api/cron/run-daily/route.ts`, `app/api/cron/runs/route.ts`
- `app/layout.tsx` (rewrite), `app/page.tsx` (rewrite), `app/profile/page.tsx`, `app/opps/page.tsx`, `app/opps/[id]/page.tsx`
- `components/AppNav.tsx`, `components/OpportunityTable.tsx`, `components/ScoreBadge.tsx`, `components/PipelineKanban.tsx`, `components/TodaysPicks.tsx`, `components/CronRunCard.tsx`, `components/ProfileEditor.tsx`, `components/OpportunityDetail.tsx`
- `fly.toml`, `Dockerfile`, `.dockerignore`
- `.github/workflows/cron.yml`
- `tests/**` mirroring `lib/` layout
- `vitest.config.ts`, `tests/setup.ts`, `tests/fixtures/sam-search-response.json`

**Modified:**
- `package.json` — add/remove deps, add scripts
- `tsconfig.json` — confirm `strict: true`
- `next.config.ts` — security headers, sqlite externalization
- `eslint.config.mjs` — keep; ensure no errors on new code
- `README.md` — rewrite for the new shape
- `CLAUDE.md` — rewrite to match new architecture

**Deleted:**
- `app/agent/`, `app/company/`, `app/contracts/`
- `app/api/agent/`, `app/api/company/`, `app/api/contracts/`, `app/api/description/`, `app/api/export-cache/`, `app/api/pdf/`, `app/api/sam/`, `app/api/score/`
- `lib/agent/`, `lib/openai.ts`, `lib/sam-api.ts`, `lib/storage.ts`, `lib/pdf-generator.ts`
- `components/AgentReasoningCard.tsx`, `components/CompanyProfileForm.tsx`, `components/ContractCard.tsx`, `components/ScoreDisplay.tsx`, `components/SearchFilters.tsx`, `components/PDFTemplates/`
- `data/*.json`
- `types/index.ts` (types regenerate from Drizzle schema)

---

## Task 1: Branch, delete legacy code, install deps

**Files:**
- Delete: see "Deleted" list above
- Modify: `package.json`

- [ ] **Step 1: Create rebuild branch**

```bash
cd /Users/joseph/govcontracts-dashboard
git checkout -b rebuild
```

- [ ] **Step 2: Delete legacy directories and files**

```bash
git rm -rf app/agent app/company app/contracts
git rm -rf app/api/agent app/api/company app/api/contracts app/api/description app/api/export-cache app/api/pdf app/api/sam app/api/score
git rm -rf lib/agent
git rm -f lib/openai.ts lib/sam-api.ts lib/storage.ts lib/pdf-generator.ts
git rm -f components/AgentReasoningCard.tsx components/CompanyProfileForm.tsx components/ContractCard.tsx components/ScoreDisplay.tsx components/SearchFilters.tsx
git rm -rf components/PDFTemplates
git rm -f data/agent-results.json data/company-profile.json data/opportunity-scores-cache.json data/sam-cache.json data/sample-opportunities.json data/saved-contracts.json
git rm -f types/index.ts
git rm -f app/page.tsx
```

Keep `app/layout.tsx`, `app/globals.css`, `components/ui/`, `lib/utils.ts`, `app/favicon.ico` — they're reused or rewritten in later tasks.

- [ ] **Step 3: Remove obsolete deps, add new ones**

```bash
npm uninstall @react-pdf/renderer openai react-hook-form @hookform/resolvers @radix-ui/react-dialog @radix-ui/react-label @radix-ui/react-progress @radix-ui/react-select @radix-ui/react-separator @radix-ui/react-tabs
npm install @anthropic-ai/sdk better-sqlite3 drizzle-orm zod pino pino-pretty marked @react-pdf/renderer
npm install -D drizzle-kit @types/better-sqlite3 @types/marked vitest @vitest/coverage-v8
```

Note: re-installing `@react-pdf/renderer` after uninstall is intentional — we want a clean dep tree (it was pulled in by deleted code; we're re-adding as an explicit direct dep for `lib/docs/render.ts`). Keep `react-hook-form`/radix removed — we'll use plain forms.

- [ ] **Step 4: Add npm scripts**

Edit `package.json` `scripts` block to:

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage",
  "db:generate": "drizzle-kit generate",
  "db:migrate": "tsx lib/db/migrate.ts",
  "db:studio": "drizzle-kit studio"
}
```

Add `"tsx": "^4"` to `devDependencies`:

```bash
npm install -D tsx
```

- [ ] **Step 5: Verify tsconfig strict**

Open `tsconfig.json` and confirm `compilerOptions.strict` is `true`. If absent, add it. Confirm `"noUncheckedIndexedAccess": true` is set (add if missing).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Delete legacy code, install rebuild deps

Begin ground-up rebuild per spec
2026-05-21-govcontracts-rebuild-design.md. Branch will not build
until Task 4 lands the new foundation."
```

---

## Task 2: Vitest setup

**Files:**
- Create: `vitest.config.ts`, `tests/setup.ts`

- [ ] **Step 1: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts'],
    coverage: { provider: 'v8', reporter: ['text', 'html'] },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
});
```

- [ ] **Step 2: Create `tests/setup.ts`**

```ts
import { beforeEach } from 'vitest';

process.env.ANTHROPIC_API_KEY ??= 'test-anthropic-key';
process.env.SAM_GOV_API_KEY ??= 'test-sam-key';
process.env.CRON_SECRET ??= 'test-cron-secret';
process.env.DAILY_COST_CAP_USD ??= '2.00';
process.env.DATABASE_URL ??= ':memory:';
process.env.NODE_ENV ??= 'test';

beforeEach(() => {
  // Per-test cleanup hooks added later.
});
```

- [ ] **Step 3: Write a smoke test**

Create `tests/smoke.test.ts`:

```ts
import { describe, it, expect } from 'vitest';

describe('smoke', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 4: Run tests, verify pass**

Run: `npm test`
Expected: `1 passed`

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Set up vitest with @/ alias and env defaults"
```

---

## Task 3: `lib/config.ts` — env validation

**Files:**
- Create: `lib/config.ts`
- Test: `tests/config.test.ts`

- [ ] **Step 1: Write failing test**

Create `tests/config.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('lib/config', () => {
  const original = { ...process.env };
  afterEach(() => { process.env = { ...original }; });

  it('parses required env vars', async () => {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
    process.env.SAM_GOV_API_KEY = 'sam-test';
    process.env.CRON_SECRET = 'secret';
    process.env.DAILY_COST_CAP_USD = '1.50';
    process.env.DATABASE_URL = './test.db';
    const mod = await import('@/lib/config?fresh=' + Date.now());
    expect(mod.config.dailyCostCapUsd).toBe(1.5);
    expect(mod.config.samGovApiKey).toBe('sam-test');
  });

  it('throws on missing required env var', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    await expect(import('@/lib/config?fresh2=' + Date.now())).rejects.toThrow(/ANTHROPIC_API_KEY/);
  });
});
```

- [ ] **Step 2: Run test, verify fail**

Run: `npm test -- tests/config.test.ts`
Expected: fails — `lib/config` does not exist.

- [ ] **Step 3: Implement `lib/config.ts`**

```ts
import { z } from 'zod';

const schema = z.object({
  ANTHROPIC_API_KEY: z.string().min(1),
  SAM_GOV_API_KEY: z.string().min(1),
  CRON_SECRET: z.string().min(16, 'CRON_SECRET must be >= 16 chars'),
  DAILY_COST_CAP_USD: z.coerce.number().positive().default(2.0),
  DATABASE_URL: z.string().default('./data/govcontracts.db'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  ANTHROPIC_MODEL: z.string().default('claude-sonnet-4-6'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error']).default('info'),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n');
  throw new Error(`Invalid environment configuration:\n${issues}`);
}

export const config = {
  anthropicApiKey: parsed.data.ANTHROPIC_API_KEY,
  samGovApiKey: parsed.data.SAM_GOV_API_KEY,
  cronSecret: parsed.data.CRON_SECRET,
  dailyCostCapUsd: parsed.data.DAILY_COST_CAP_USD,
  databaseUrl: parsed.data.DATABASE_URL,
  nodeEnv: parsed.data.NODE_ENV,
  anthropicModel: parsed.data.ANTHROPIC_MODEL,
  logLevel: parsed.data.LOG_LEVEL,
} as const;

export type Config = typeof config;
```

- [ ] **Step 4: Run test, verify pass**

Run: `npm test -- tests/config.test.ts`
Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Add lib/config with zod env validation"
```

---

## Task 4: `lib/log.ts` — pino logger

**Files:**
- Create: `lib/log.ts`
- Test: `tests/log.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// tests/log.test.ts
import { describe, it, expect } from 'vitest';
import { log } from '@/lib/log';

describe('lib/log', () => {
  it('exports a pino logger with the expected methods', () => {
    expect(typeof log.info).toBe('function');
    expect(typeof log.error).toBe('function');
    expect(typeof log.child).toBe('function');
  });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npm test -- tests/log.test.ts`
Expected: import error.

- [ ] **Step 3: Implement `lib/log.ts`**

```ts
import pino from 'pino';
import { config } from './config';

export const log = pino({
  level: config.logLevel,
  base: { app: 'govcontracts' },
  ...(config.nodeEnv === 'development'
    ? { transport: { target: 'pino-pretty', options: { colorize: true } } }
    : {}),
});

export type Logger = typeof log;
```

- [ ] **Step 4: Run, verify pass**

Run: `npm test -- tests/log.test.ts`
Expected: 1 passed.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Add lib/log pino instance"
```

---

## Task 5: Drizzle setup + schema

**Files:**
- Create: `drizzle.config.ts`, `lib/db/schema.ts`, `lib/db/client.ts`, `lib/db/migrate.ts`
- Test: `tests/db/schema.test.ts`

- [ ] **Step 1: Write `drizzle.config.ts`**

```ts
import type { Config } from 'drizzle-kit';

export default {
  schema: './lib/db/schema.ts',
  out: './lib/db/migrations',
  dialect: 'sqlite',
  dbCredentials: { url: process.env.DATABASE_URL ?? './data/govcontracts.db' },
} satisfies Config;
```

- [ ] **Step 2: Write `lib/db/schema.ts`**

```ts
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
```

- [ ] **Step 3: Write `lib/db/client.ts`**

```ts
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { config } from '../config';
import * as schema from './schema';

const sqlite = new Database(config.databaseUrl);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });
export { schema };
export type DB = typeof db;
```

- [ ] **Step 4: Write `lib/db/migrate.ts`**

```ts
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { config } from '../config';
import path from 'node:path';
import fs from 'node:fs';

const dbPath = config.databaseUrl;
const dir = path.dirname(dbPath);
if (dir !== '.' && !fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const sqlite = new Database(dbPath);
const db = drizzle(sqlite);
migrate(db, { migrationsFolder: './lib/db/migrations' });
console.log('migrations complete');
sqlite.close();
```

- [ ] **Step 5: Generate initial migration**

```bash
npm run db:generate -- --name initial
```

Verify a SQL file appears in `lib/db/migrations/`.

- [ ] **Step 6: Write schema test**

```ts
// tests/db/schema.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

function freshDb() {
  const sqlite = new Database(':memory:');
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: './lib/db/migrations' });
  return { db, sqlite };
}

describe('schema', () => {
  it('round-trips a company profile with JSON columns', () => {
    const { db } = freshDb();
    db.insert(schema.companyProfile).values({
      id: 1,
      name: 'Acme',
      uei: 'UEI123',
      naicsCodes: ['541511', '541512'],
      certifications: ['SB', 'WOSB'],
      capabilities: 'We do things.',
      contactName: 'Joe',
      contactEmail: 'joe@example.com',
    }).run();

    const row = db.select().from(schema.companyProfile).where(eq(schema.companyProfile.id, 1)).get();
    expect(row?.naicsCodes).toEqual(['541511', '541512']);
    expect(row?.version).toBe(1);
  });

  it('enforces opportunity status enum at app level', () => {
    const { db } = freshDb();
    const now = new Date();
    db.insert(schema.opportunities).values({
      noticeId: 'n1',
      rawJson: { foo: 'bar' },
      title: 't',
      agency: 'a',
      firstSeenAt: now,
      lastSyncedAt: now,
    }).run();
    const row = db.select().from(schema.opportunities).get();
    expect(row?.status).toBe('new');
  });
});
```

- [ ] **Step 7: Run schema test, verify pass**

Run: `npm test -- tests/db/schema.test.ts`
Expected: 2 passed.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "Add Drizzle schema, db client, initial migration"
```

---

## Task 6: SAM client + zod schemas

**Files:**
- Create: `lib/sam/schemas.ts`, `lib/sam/client.ts`, `tests/fixtures/sam-search-response.json`
- Test: `tests/sam/client.test.ts`

- [ ] **Step 1: Capture a real SAM response fixture**

Save a real (or hand-crafted, structurally accurate) SAM search response to `tests/fixtures/sam-search-response.json`. Minimal accurate shape:

```json
{
  "totalRecords": 2,
  "limit": 25,
  "offset": 0,
  "opportunitiesData": [
    {
      "noticeId": "abc123",
      "title": "Janitorial Services",
      "fullParentPathName": "DEPT OF DEFENSE.ARMY",
      "naicsCode": "561720",
      "typeOfSetAsideDescription": "Total Small Business Set-Aside",
      "postedDate": "2026-05-19",
      "responseDeadLine": "2026-06-15T17:00:00-04:00",
      "awardCeiling": "150000",
      "placeOfPerformance": { "city": { "name": "Fort Bragg" }, "state": { "code": "NC" } },
      "description": "Provide janitorial services...",
      "uiLink": "https://sam.gov/opp/abc123/view"
    },
    {
      "noticeId": "def456",
      "title": "IT Help Desk",
      "fullParentPathName": "GSA",
      "naicsCode": "541512",
      "typeOfSetAsideDescription": "WOSB",
      "postedDate": "2026-05-20",
      "responseDeadLine": "2026-06-20T17:00:00-04:00",
      "awardCeiling": "275000",
      "placeOfPerformance": { "city": { "name": "Arlington" }, "state": { "code": "VA" } },
      "description": "Tier 1 help desk support...",
      "uiLink": "https://sam.gov/opp/def456/view"
    }
  ]
}
```

- [ ] **Step 2: Write `lib/sam/schemas.ts`**

```ts
import { z } from 'zod';

export const SamOpportunityRaw = z.object({
  noticeId: z.string(),
  title: z.string(),
  fullParentPathName: z.string().optional().default(''),
  naicsCode: z.string().nullish(),
  typeOfSetAsideDescription: z.string().nullish(),
  postedDate: z.string().nullish(),
  responseDeadLine: z.string().nullish(),
  awardCeiling: z.union([z.string(), z.number()]).nullish(),
  placeOfPerformance: z
    .object({
      city: z.object({ name: z.string() }).partial().optional(),
      state: z.object({ code: z.string() }).partial().optional(),
    })
    .nullish(),
  description: z.string().nullish(),
  uiLink: z.string().url().nullish(),
}).passthrough();

export const SamSearchResponse = z.object({
  totalRecords: z.number(),
  limit: z.number(),
  offset: z.number(),
  opportunitiesData: z.array(SamOpportunityRaw),
});

export type SamOpportunityRaw = z.infer<typeof SamOpportunityRaw>;
export type SamSearchResponse = z.infer<typeof SamSearchResponse>;
```

- [ ] **Step 3: Write failing test for client**

```ts
// tests/sam/client.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import fixture from '../fixtures/sam-search-response.json';

describe('lib/sam/client', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('sends API key as header, never in URL', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(fixture), { status: 200, headers: { 'content-type': 'application/json' } }),
    );
    const { samFetch } = await import('@/lib/sam/client');
    await samFetch('/opportunities/v2/search', { naics: '541512' });
    const [url, init] = fetchSpy.mock.calls[0];
    expect(String(url)).not.toContain('api_key');
    expect((init as RequestInit).headers).toMatchObject({ 'X-Api-Key': 'test-sam-key' });
  });

  it('retries 5xx then succeeds', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('boom', { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(fixture), { status: 200 }));
    const { samFetch } = await import('@/lib/sam/client');
    const result = await samFetch('/opportunities/v2/search', { naics: '541512' });
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect((result as any).totalRecords).toBe(2);
  });

  it('throws after exhausting retries', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('boom', { status: 502 }));
    const { samFetch } = await import('@/lib/sam/client');
    await expect(samFetch('/opportunities/v2/search', {})).rejects.toThrow(/SAM/);
  });

  it('rejects non-SAM hosts', async () => {
    const { samFetch } = await import('@/lib/sam/client');
    await expect(samFetch('https://evil.example.com/x', {})).rejects.toThrow(/host/i);
  });
});
```

- [ ] **Step 4: Run test, verify fail**

Run: `npm test -- tests/sam/client.test.ts`
Expected: import error.

- [ ] **Step 5: Implement `lib/sam/client.ts`**

```ts
import { config } from '../config';
import { log } from '../log';
import { SamSearchResponse } from './schemas';
import { z } from 'zod';

const SAM_BASE = 'https://api.sam.gov';
const ALLOWED_HOSTS = new Set(['api.sam.gov']);

const MAX_RETRIES = 3;
const BASE_BACKOFF_MS = 500;

function buildUrl(pathOrUrl: string, query: Record<string, string | number | undefined>): URL {
  const url = pathOrUrl.startsWith('http') ? new URL(pathOrUrl) : new URL(pathOrUrl, SAM_BASE);
  if (!ALLOWED_HOSTS.has(url.host)) {
    throw new Error(`Disallowed host: ${url.host}`);
  }
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  }
  return url;
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function samFetch(
  pathOrUrl: string,
  query: Record<string, string | number | undefined>,
): Promise<unknown> {
  const url = buildUrl(pathOrUrl, query);
  let lastErr: unknown;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(url, {
      headers: {
        'X-Api-Key': config.samGovApiKey,
        accept: 'application/json',
      },
    });
    if (res.ok) {
      return res.json();
    }
    if (res.status === 429 || res.status >= 500) {
      const backoff = BASE_BACKOFF_MS * 2 ** (attempt - 1);
      log.warn({ status: res.status, attempt, backoff }, 'SAM retry');
      lastErr = new Error(`SAM ${res.status}`);
      await sleep(backoff);
      continue;
    }
    const body = await res.text().catch(() => '');
    throw new Error(`SAM ${res.status}: ${body.slice(0, 200)}`);
  }
  throw new Error(`SAM request failed after ${MAX_RETRIES} attempts: ${String(lastErr)}`);
}

export async function samSearch(query: {
  naics: string;
  postedFrom?: string;
  postedTo?: string;
  limit?: number;
  offset?: number;
}) {
  const raw = await samFetch('/opportunities/v2/search', {
    api_version: 'v2',
    ncode: query.naics,
    postedFrom: query.postedFrom,
    postedTo: query.postedTo,
    limit: query.limit ?? 25,
    offset: query.offset ?? 0,
  });
  const parsed = SamSearchResponse.safeParse(raw);
  if (!parsed.success) {
    log.error({ issues: parsed.error.issues }, 'SAM response shape mismatch');
    throw new Error('Invalid SAM response shape');
  }
  return parsed.data;
}
```

- [ ] **Step 6: Run test, verify pass**

Run: `npm test -- tests/sam/client.test.ts`
Expected: 4 passed.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Add SAM client with header auth, retries, host allowlist, zod parse"
```

---

## Task 7: `lib/sam/search.ts` — search by profile

**Files:**
- Create: `lib/sam/search.ts`
- Test: `tests/sam/search.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// tests/sam/search.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import fixture from '../fixtures/sam-search-response.json';

vi.mock('@/lib/sam/client', () => ({
  samSearch: vi.fn(),
}));

import { samSearch } from '@/lib/sam/client';
import { searchByProfile } from '@/lib/sam/search';

describe('searchByProfile', () => {
  beforeEach(() => { vi.mocked(samSearch).mockReset(); });

  it('fans out one call per NAICS and merges results', async () => {
    vi.mocked(samSearch).mockResolvedValue(fixture as any);
    const opps = await searchByProfile({
      naicsCodes: ['541511', '541512'],
      postedFrom: '2026-05-01',
      maxAwardCeiling: 350_000,
    });
    expect(samSearch).toHaveBeenCalledTimes(2);
    expect(opps).toHaveLength(4); // two NAICS x two opps each
  });

  it('filters out opps over the maxAwardCeiling', async () => {
    const big = { ...fixture, opportunitiesData: [{ ...fixture.opportunitiesData[0], awardCeiling: '500000' }] };
    vi.mocked(samSearch).mockResolvedValue(big as any);
    const opps = await searchByProfile({
      naicsCodes: ['541511'],
      postedFrom: '2026-05-01',
      maxAwardCeiling: 350_000,
    });
    expect(opps).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npm test -- tests/sam/search.test.ts`
Expected: import error.

- [ ] **Step 3: Implement `lib/sam/search.ts`**

```ts
import { samSearch } from './client';
import type { SamOpportunityRaw } from './schemas';

export interface SearchByProfileArgs {
  naicsCodes: string[];
  postedFrom: string; // YYYY-MM-DD
  postedTo?: string;
  maxAwardCeiling?: number;
  perNaicsLimit?: number;
}

export async function searchByProfile(args: SearchByProfileArgs): Promise<SamOpportunityRaw[]> {
  const { naicsCodes, postedFrom, postedTo, maxAwardCeiling, perNaicsLimit = 25 } = args;
  const all: SamOpportunityRaw[] = [];
  for (const naics of naicsCodes) {
    const res = await samSearch({ naics, postedFrom, postedTo, limit: perNaicsLimit });
    for (const opp of res.opportunitiesData) {
      if (maxAwardCeiling !== undefined) {
        const ceil = opp.awardCeiling != null ? Number(opp.awardCeiling) : NaN;
        if (Number.isFinite(ceil) && ceil > maxAwardCeiling) continue;
      }
      all.push(opp);
    }
  }
  // dedupe by noticeId, keep first occurrence
  const seen = new Set<string>();
  return all.filter((o) => (seen.has(o.noticeId) ? false : (seen.add(o.noticeId), true)));
}
```

- [ ] **Step 4: Run, verify pass**

Run: `npm test -- tests/sam/search.test.ts`
Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Add searchByProfile with fan-out, dedupe, ceiling filter"
```

---

## Task 8: `lib/ai/client.ts` — Anthropic singleton

**Files:**
- Create: `lib/ai/client.ts`
- Test: none — trivial wrapper, covered by integration tests downstream.

- [ ] **Step 1: Implement**

```ts
import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config';

export const anthropic = new Anthropic({
  apiKey: config.anthropicApiKey,
  maxRetries: 2,
});

// Sonnet 4.6 pricing (USD per 1M tokens) — update when model/prices change.
export const PRICING: Record<string, { input: number; output: number }> = {
  'claude-sonnet-4-6': { input: 3.0, output: 15.0 },
};

export function costFor(model: string, promptTokens: number, completionTokens: number): number {
  const p = PRICING[model] ?? PRICING['claude-sonnet-4-6'];
  return (promptTokens / 1_000_000) * p.input + (completionTokens / 1_000_000) * p.output;
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "Add Anthropic client singleton with cost helper"
```

---

## Task 9: `lib/ai/score.ts` — structured scoring via tool use

**Files:**
- Create: `lib/ai/schemas.ts`, `lib/ai/score.ts`
- Test: `tests/ai/score.test.ts`

- [ ] **Step 1: Write `lib/ai/schemas.ts`**

```ts
import { z } from 'zod';

const Match = z.object({ matched: z.boolean(), reason: z.string() });

export const ScoreSchema = z.object({
  fit_score: z.number().int().min(0).max(100),
  recommendation: z.enum(['GO', 'NO_GO', 'MAYBE']),
  naics_match: Match,
  capability_match: Match,
  setaside_match: Match,
  key_requirements: z.array(z.string()),
  risks: z.array(z.string()),
  win_themes: z.array(z.string()),
});

export type ScoreResult = z.infer<typeof ScoreSchema>;

// JSON Schema form (what Anthropic tool definitions accept)
export const ScoreJsonSchema = {
  type: 'object',
  required: ['fit_score', 'recommendation', 'naics_match', 'capability_match', 'setaside_match', 'key_requirements', 'risks', 'win_themes'],
  properties: {
    fit_score: { type: 'integer', minimum: 0, maximum: 100 },
    recommendation: { type: 'string', enum: ['GO', 'NO_GO', 'MAYBE'] },
    naics_match: {
      type: 'object',
      required: ['matched', 'reason'],
      properties: { matched: { type: 'boolean' }, reason: { type: 'string' } },
    },
    capability_match: {
      type: 'object',
      required: ['matched', 'reason'],
      properties: { matched: { type: 'boolean' }, reason: { type: 'string' } },
    },
    setaside_match: {
      type: 'object',
      required: ['matched', 'reason'],
      properties: { matched: { type: 'boolean' }, reason: { type: 'string' } },
    },
    key_requirements: { type: 'array', items: { type: 'string' } },
    risks: { type: 'array', items: { type: 'string' } },
    win_themes: { type: 'array', items: { type: 'string' } },
  },
} as const;
```

- [ ] **Step 2: Write failing test**

```ts
// tests/ai/score.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/ai/client', async () => {
  return {
    anthropic: { messages: { create: vi.fn() } },
    costFor: (_m: string, p: number, c: number) => (p / 1_000_000) * 3 + (c / 1_000_000) * 15,
    PRICING: { 'claude-sonnet-4-6': { input: 3, output: 15 } },
  };
});

import { anthropic } from '@/lib/ai/client';
import { scoreOpportunity } from '@/lib/ai/score';

const fakeProfile = {
  id: 1, version: 3, name: 'Acme', uei: 'X',
  naicsCodes: ['541512'], certifications: ['SB'],
  capabilities: 'IT services.',
  contactName: 'a', contactEmail: 'a@a.com', contactPhone: null, cageCode: null,
  updatedAt: new Date(),
} as any;

const fakeOpp = {
  noticeId: 'n1', title: 'Help desk', agency: 'GSA', naics: '541512',
  setAside: 'Small Business', description: 'Tier 1 support.',
  awardCeiling: 200_000, responseDeadline: new Date(Date.now() + 10 * 86400_000),
  rawJson: {}, postedAt: new Date(), placeOfPerformance: 'DC',
  firstSeenAt: new Date(), lastSyncedAt: new Date(), status: 'new' as const,
};

describe('scoreOpportunity', () => {
  beforeEach(() => vi.mocked(anthropic.messages.create as any).mockReset());

  it('parses tool-use output and returns a validated Score', async () => {
    vi.mocked(anthropic.messages.create as any).mockResolvedValue({
      content: [
        {
          type: 'tool_use',
          name: 'record_score',
          input: {
            fit_score: 82,
            recommendation: 'GO',
            naics_match: { matched: true, reason: 'exact 541512' },
            capability_match: { matched: true, reason: 'IT services align' },
            setaside_match: { matched: true, reason: 'SB cert held' },
            key_requirements: ['24/7 coverage', 'ITIL'],
            risks: ['Tight deadline'],
            win_themes: ['Cost', 'Past performance'],
          },
        },
      ],
      usage: { input_tokens: 1200, output_tokens: 300 },
      model: 'claude-sonnet-4-6',
    });

    const result = await scoreOpportunity(fakeOpp, fakeProfile);
    expect(result.fitScore).toBe(82);
    expect(result.recommendation).toBe('GO');
    expect(result.keyRequirements).toContain('24/7 coverage');
    expect(result.promptTokens).toBe(1200);
    expect(result.costUsd).toBeCloseTo((1200 / 1e6) * 3 + (300 / 1e6) * 15);
  });

  it('throws when model returns no tool_use block', async () => {
    vi.mocked(anthropic.messages.create as any).mockResolvedValue({
      content: [{ type: 'text', text: 'hi' }],
      usage: { input_tokens: 10, output_tokens: 5 },
      model: 'claude-sonnet-4-6',
    });
    await expect(scoreOpportunity(fakeOpp, fakeProfile)).rejects.toThrow(/tool_use/);
  });
});
```

- [ ] **Step 3: Run, verify fail**

Run: `npm test -- tests/ai/score.test.ts`
Expected: import error.

- [ ] **Step 4: Implement `lib/ai/score.ts`**

```ts
import { anthropic, costFor } from './client';
import { ScoreSchema, ScoreJsonSchema } from './schemas';
import { config } from '../config';
import type { CompanyProfile, Opportunity } from '../db/schema';

export interface ScoreOutput {
  fitScore: number;
  recommendation: 'GO' | 'NO_GO' | 'MAYBE';
  naicsMatch: { matched: boolean; reason: string };
  capabilityMatch: { matched: boolean; reason: string };
  setasideMatch: { matched: boolean; reason: string };
  keyRequirements: string[];
  risks: string[];
  winThemes: string[];
  model: string;
  promptTokens: number;
  completionTokens: number;
  costUsd: number;
}

const SYSTEM = `You are an expert federal contracting analyst evaluating opportunities for a small business bidding on contracts at or below the Simplified Acquisition Threshold ($350,000). Past performance records are NOT required at this threshold; do not penalize for their absence.

You must call the record_score tool exactly once with your analysis.`;

function userPrompt(opp: Opportunity, profile: CompanyProfile): string {
  return `# Company profile
Name: ${profile.name}
NAICS codes: ${profile.naicsCodes.join(', ')}
Certifications: ${profile.certifications.join(', ') || 'none'}
Capabilities: ${profile.capabilities}

# Opportunity
Title: ${opp.title}
Agency: ${opp.agency}
NAICS: ${opp.naics ?? 'n/a'}
Set-aside: ${opp.setAside ?? 'none'}
Award ceiling: ${opp.awardCeiling != null ? `$${opp.awardCeiling.toLocaleString()}` : 'n/a'}
Response deadline: ${opp.responseDeadline?.toISOString() ?? 'n/a'}
Place of performance: ${opp.placeOfPerformance ?? 'n/a'}

Description:
${(opp.description ?? '').slice(0, 8000)}

Score this opportunity for fit. Be honest about risks and only recommend GO when the match is strong.`;
}

export async function scoreOpportunity(
  opp: Opportunity,
  profile: CompanyProfile,
): Promise<ScoreOutput> {
  const model = config.anthropicModel;
  const response = await anthropic.messages.create({
    model,
    max_tokens: 1500,
    system: SYSTEM,
    tools: [
      {
        name: 'record_score',
        description: 'Record the fit analysis for this opportunity.',
        input_schema: ScoreJsonSchema as any,
      },
    ],
    tool_choice: { type: 'tool', name: 'record_score' },
    messages: [{ role: 'user', content: userPrompt(opp, profile) }],
  });

  const toolUse = response.content.find((c: any) => c.type === 'tool_use' && c.name === 'record_score') as
    | { type: 'tool_use'; input: unknown }
    | undefined;
  if (!toolUse) throw new Error('Anthropic response missing record_score tool_use block');

  const parsed = ScoreSchema.parse(toolUse.input);
  const promptTokens = response.usage.input_tokens;
  const completionTokens = response.usage.output_tokens;

  return {
    fitScore: parsed.fit_score,
    recommendation: parsed.recommendation,
    naicsMatch: parsed.naics_match,
    capabilityMatch: parsed.capability_match,
    setasideMatch: parsed.setaside_match,
    keyRequirements: parsed.key_requirements,
    risks: parsed.risks,
    winThemes: parsed.win_themes,
    model: response.model,
    promptTokens,
    completionTokens,
    costUsd: costFor(response.model, promptTokens, completionTokens),
  };
}
```

- [ ] **Step 5: Run, verify pass**

Run: `npm test -- tests/ai/score.test.ts`
Expected: 2 passed.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Add scoreOpportunity with tool-use structured output"
```

---

## Task 10: `lib/ai/docs.ts` — document generation

**Files:**
- Create: `lib/ai/docs.ts`
- Test: `tests/ai/docs.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// tests/ai/docs.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/ai/client', () => ({
  anthropic: { messages: { create: vi.fn() } },
  costFor: () => 0.01,
}));

import { anthropic } from '@/lib/ai/client';
import { generateDoc } from '@/lib/ai/docs';

const profile = {
  id: 1, version: 1, name: 'Acme', uei: 'X', cageCode: null,
  naicsCodes: ['541512'], certifications: ['SB'], capabilities: 'IT',
  contactName: 'a', contactEmail: 'a@a.com', contactPhone: null,
  updatedAt: new Date(),
} as any;
const opp = {
  noticeId: 'n1', title: 'Help desk', agency: 'GSA', naics: '541512',
  description: 'Tier 1.', setAside: 'SB',
  rawJson: {}, postedAt: new Date(), responseDeadline: new Date(), awardCeiling: 200000,
  placeOfPerformance: 'DC', firstSeenAt: new Date(), lastSyncedAt: new Date(), status: 'new' as const,
} as any;

describe('generateDoc', () => {
  beforeEach(() => vi.mocked(anthropic.messages.create as any).mockReset());

  it('returns markdown text and token usage for analysis kind', async () => {
    vi.mocked(anthropic.messages.create as any).mockResolvedValue({
      content: [{ type: 'text', text: '# Analysis\n...' }],
      usage: { input_tokens: 500, output_tokens: 800 },
      model: 'claude-sonnet-4-6',
    });
    const out = await generateDoc('analysis', opp, profile);
    expect(out.markdown).toMatch(/^# /);
    expect(out.promptTokens).toBe(500);
  });

  it('rejects unknown kind', async () => {
    await expect(generateDoc('bogus' as any, opp, profile)).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npm test -- tests/ai/docs.test.ts`
Expected: import error.

- [ ] **Step 3: Implement `lib/ai/docs.ts`**

```ts
import { anthropic, costFor } from './client';
import { config } from '../config';
import type { CompanyProfile, Opportunity } from '../db/schema';

export type DocKind = 'capability' | 'analysis' | 'proposal' | 'compliance_matrix';

const SYSTEM_BASE = `You write federal-contracting documents for a small business bidding on opportunities at or below the Simplified Acquisition Threshold ($350,000). Past-performance records are NOT required at this threshold. Output clean Markdown only — no preamble, no commentary, no fenced code blocks wrapping the whole document.`;

const KIND_PROMPTS: Record<DocKind, (opp: Opportunity, profile: CompanyProfile) => string> = {
  capability: (_o, p) => `Generate a 1-page Capability Statement for ${p.name}.
Sections: Company Overview, Core Capabilities, NAICS Codes, Certifications, Differentiators, Contact.
Use the profile data verbatim; do not invent past performance.

Profile:
${profileBlock(p)}`,

  analysis: (o, p) => `Generate a concise GO/NO-GO analysis memo for the opportunity below, evaluated against the profile.
Sections: Summary, NAICS & Set-Aside Fit, Capability Fit, Risks, Recommendation (GO/NO-GO/MAYBE with one-paragraph rationale).
Keep total length under 700 words.

Opportunity:
${oppBlock(o)}

Profile:
${profileBlock(p)}`,

  proposal: (o, p) => `Generate a proposal outline with draft prose for the opportunity below.
Sections: Executive Summary, Technical Approach, Management Approach, Pricing Approach (placeholders OK), Why ${p.name}.
This is a starting draft; the user will edit before submission. Stay grounded in the solicitation text.

Opportunity:
${oppBlock(o)}

Profile:
${profileBlock(p)}`,

  compliance_matrix: (o, _p) => `Generate a compliance matrix as a Markdown table for the opportunity below.
Columns: Requirement | Source (section/paragraph) | Mandatory? (Yes/No) | Our Response.
Extract every "shall", "must", or numbered requirement you can identify from the description. If a column value is unknowable, write "TBD".

Opportunity:
${oppBlock(o)}`,
};

function profileBlock(p: CompanyProfile): string {
  return [
    `Name: ${p.name}`,
    `UEI: ${p.uei}`,
    `CAGE: ${p.cageCode ?? 'n/a'}`,
    `NAICS: ${p.naicsCodes.join(', ')}`,
    `Certifications: ${p.certifications.join(', ') || 'none'}`,
    `Contact: ${p.contactName} <${p.contactEmail}>${p.contactPhone ? ` / ${p.contactPhone}` : ''}`,
    '',
    'Capabilities:',
    p.capabilities,
  ].join('\n');
}

function oppBlock(o: Opportunity): string {
  return [
    `Title: ${o.title}`,
    `Agency: ${o.agency}`,
    `NAICS: ${o.naics ?? 'n/a'}`,
    `Set-aside: ${o.setAside ?? 'none'}`,
    `Award ceiling: ${o.awardCeiling != null ? `$${o.awardCeiling.toLocaleString()}` : 'n/a'}`,
    `Response deadline: ${o.responseDeadline?.toISOString() ?? 'n/a'}`,
    '',
    'Description:',
    (o.description ?? '').slice(0, 10000),
  ].join('\n');
}

export interface DocOutput {
  markdown: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  costUsd: number;
}

export async function generateDoc(
  kind: DocKind,
  opp: Opportunity,
  profile: CompanyProfile,
): Promise<DocOutput> {
  const promptFn = KIND_PROMPTS[kind];
  if (!promptFn) throw new Error(`Unknown doc kind: ${kind}`);

  const response = await anthropic.messages.create({
    model: config.anthropicModel,
    max_tokens: 4096,
    system: SYSTEM_BASE,
    messages: [{ role: 'user', content: promptFn(opp, profile) }],
  });

  const text = response.content
    .filter((c: any) => c.type === 'text')
    .map((c: any) => c.text)
    .join('\n')
    .trim();
  if (!text) throw new Error('Empty document from model');

  const promptTokens = response.usage.input_tokens;
  const completionTokens = response.usage.output_tokens;
  return {
    markdown: text,
    model: response.model,
    promptTokens,
    completionTokens,
    costUsd: costFor(response.model, promptTokens, completionTokens),
  };
}
```

- [ ] **Step 4: Run, verify pass**

Run: `npm test -- tests/ai/docs.test.ts`
Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Add generateDoc with per-kind prompts for capability/analysis/proposal/compliance"
```

---

## Task 11: `lib/docs/render.ts` — markdown → PDF

**Files:**
- Create: `lib/docs/render.ts`
- Test: `tests/docs/render.test.ts`

PDF library decision: `@react-pdf/renderer` driven by a minimal `marked`-token walker. Keeps deps already in the tree (no Chromium), works in a Node-only environment, sufficient quality for SAT-level 1-pagers.

- [ ] **Step 1: Write failing test**

```ts
// tests/docs/render.test.ts
import { describe, it, expect } from 'vitest';
import { renderMarkdownToPdf } from '@/lib/docs/render';

describe('renderMarkdownToPdf', () => {
  it('produces a PDF buffer starting with %PDF', async () => {
    const buf = await renderMarkdownToPdf('# Title\n\nHello **world**.\n\n- one\n- two');
    expect(buf.length).toBeGreaterThan(500);
    expect(buf.slice(0, 4).toString()).toBe('%PDF');
  });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npm test -- tests/docs/render.test.ts`
Expected: import error.

- [ ] **Step 3: Implement `lib/docs/render.ts`**

```ts
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer';
import { marked, type Tokens } from 'marked';
import React from 'react';

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 11, fontFamily: 'Helvetica', lineHeight: 1.4 },
  h1: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  h2: { fontSize: 16, fontWeight: 'bold', marginTop: 12, marginBottom: 6 },
  h3: { fontSize: 13, fontWeight: 'bold', marginTop: 10, marginBottom: 4 },
  p: { marginBottom: 6 },
  li: { marginLeft: 12, marginBottom: 2 },
  table: { marginBottom: 8 },
  tr: { flexDirection: 'row', borderBottomWidth: 0.5, borderColor: '#ccc', paddingVertical: 3 },
  th: { flex: 1, fontWeight: 'bold', paddingHorizontal: 4 },
  td: { flex: 1, paddingHorizontal: 4 },
  hr: { borderBottomWidth: 0.5, borderColor: '#999', marginVertical: 8 },
  code: { fontFamily: 'Courier', fontSize: 10, backgroundColor: '#f4f4f4', padding: 4, marginBottom: 6 },
});

function renderInline(text: string): React.ReactNode {
  // Strip simple inline markdown (bold/italic markers) — react-pdf doesn't do inline mixed fonts
  // without more work. For SAT-level docs, plain text is acceptable.
  return text.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1').replace(/`(.+?)`/g, '$1');
}

function renderToken(token: Tokens.Generic, key: number): React.ReactNode {
  switch (token.type) {
    case 'heading': {
      const t = token as Tokens.Heading;
      const style = t.depth === 1 ? styles.h1 : t.depth === 2 ? styles.h2 : styles.h3;
      return React.createElement(Text, { key, style }, renderInline(t.text));
    }
    case 'paragraph':
      return React.createElement(Text, { key, style: styles.p }, renderInline((token as Tokens.Paragraph).text));
    case 'list': {
      const t = token as Tokens.List;
      return React.createElement(
        View,
        { key },
        t.items.map((item, i) =>
          React.createElement(Text, { key: i, style: styles.li }, `• ${renderInline(item.text)}`),
        ),
      );
    }
    case 'table': {
      const t = token as Tokens.Table;
      const headerRow = React.createElement(
        View,
        { key: 'h', style: styles.tr },
        t.header.map((cell, i) => React.createElement(Text, { key: i, style: styles.th }, renderInline(cell.text))),
      );
      const bodyRows = t.rows.map((row, ri) =>
        React.createElement(
          View,
          { key: ri, style: styles.tr },
          row.map((cell, ci) => React.createElement(Text, { key: ci, style: styles.td }, renderInline(cell.text))),
        ),
      );
      return React.createElement(View, { key, style: styles.table }, headerRow, ...bodyRows);
    }
    case 'hr':
      return React.createElement(View, { key, style: styles.hr });
    case 'code':
      return React.createElement(Text, { key, style: styles.code }, (token as Tokens.Code).text);
    case 'space':
      return null;
    default:
      return React.createElement(Text, { key, style: styles.p }, renderInline((token as any).raw ?? ''));
  }
}

export async function renderMarkdownToPdf(markdown: string): Promise<Buffer> {
  const tokens = marked.lexer(markdown);
  const children = tokens.map((t, i) => renderToken(t, i));
  const doc = React.createElement(
    Document,
    null,
    React.createElement(Page, { size: 'LETTER', style: styles.page }, ...children),
  );
  return renderToBuffer(doc);
}
```

- [ ] **Step 4: Run, verify pass**

Run: `npm test -- tests/docs/render.test.ts`
Expected: 1 passed.

- [ ] **Step 5: Create capability statement template**

Create `lib/docs/templates/capability.md` (placeholder content; the AI doc-gen renders the real one but we want a static fallback the renderer can also handle):

```md
# {{name}} — Capability Statement

## Company Overview
{{capabilities}}

## NAICS Codes
{{naics}}

## Certifications
{{certifications}}

## Contact
{{contactName}} · {{contactEmail}}{{#contactPhone}} · {{contactPhone}}{{/contactPhone}}
```

This file is unused by the AI path but available if we later add a deterministic fallback. Not wired into render in this plan.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Add markdown-to-PDF renderer via @react-pdf + marked"
```

---

## Task 12: `lib/pipeline/heuristic.ts` — pre-AI ranking

**Files:**
- Create: `lib/pipeline/heuristic.ts`
- Test: `tests/pipeline/heuristic.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// tests/pipeline/heuristic.test.ts
import { describe, it, expect } from 'vitest';
import { rankCandidates } from '@/lib/pipeline/heuristic';

const profile = { naicsCodes: ['541512'], certifications: ['SB'] } as any;

function opp(over: any = {}) {
  return {
    noticeId: over.noticeId ?? 'n',
    title: 't', agency: 'a',
    naics: '541512', setAside: 'Small Business',
    awardCeiling: 100_000,
    responseDeadline: new Date(Date.now() + 14 * 86400_000),
    postedAt: new Date(Date.now() - 1 * 86400_000),
    description: '', rawJson: {}, placeOfPerformance: '',
    firstSeenAt: new Date(), lastSyncedAt: new Date(), status: 'new' as const,
    ...over,
  };
}

describe('rankCandidates', () => {
  it('ranks NAICS-exact and set-aside match above non-matches', () => {
    const a = opp({ noticeId: 'a' });
    const b = opp({ noticeId: 'b', naics: '999999', setAside: null });
    const ranked = rankCandidates([b, a], profile);
    expect(ranked[0].noticeId).toBe('a');
  });

  it('drops opportunities past their response deadline', () => {
    const expired = opp({ noticeId: 'x', responseDeadline: new Date(Date.now() - 86400_000) });
    expect(rankCandidates([expired], profile)).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npm test -- tests/pipeline/heuristic.test.ts`
Expected: import error.

- [ ] **Step 3: Implement `lib/pipeline/heuristic.ts`**

```ts
import type { Opportunity, CompanyProfile } from '../db/schema';

export function rankCandidates(
  opps: Opportunity[],
  profile: Pick<CompanyProfile, 'naicsCodes' | 'certifications'>,
): Opportunity[] {
  const now = Date.now();
  const naicsSet = new Set(profile.naicsCodes);
  const certsLower = new Set(profile.certifications.map((c) => c.toLowerCase()));

  const fresh = opps.filter((o) => !o.responseDeadline || o.responseDeadline.getTime() > now);

  const scored = fresh.map((o) => {
    let score = 0;
    if (o.naics && naicsSet.has(o.naics)) score += 50;
    if (o.setAside) {
      const lower = o.setAside.toLowerCase();
      for (const c of certsLower) {
        if (lower.includes(c)) {
          score += 30;
          break;
        }
      }
    }
    // recency: newer posted = higher score, up to 10
    if (o.postedAt) {
      const ageDays = (now - o.postedAt.getTime()) / 86400_000;
      score += Math.max(0, 10 - ageDays);
    }
    // ceiling fit: prefer opps within sweet spot $50k–$350k
    if (o.awardCeiling != null) {
      if (o.awardCeiling >= 50_000 && o.awardCeiling <= 350_000) score += 10;
    }
    return { o, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.o);
}
```

- [ ] **Step 4: Run, verify pass**

Run: `npm test -- tests/pipeline/heuristic.test.ts`
Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Add pipeline heuristic ranking"
```

---

## Task 13: `lib/pipeline/daily-run.ts` — orchestration

**Files:**
- Create: `lib/pipeline/daily-run.ts`
- Test: `tests/pipeline/daily-run.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// tests/pipeline/daily-run.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

vi.mock('@/lib/sam/search', () => ({ searchByProfile: vi.fn() }));
vi.mock('@/lib/ai/score', () => ({ scoreOpportunity: vi.fn() }));

import { searchByProfile } from '@/lib/sam/search';
import { scoreOpportunity } from '@/lib/ai/score';
import { runDaily } from '@/lib/pipeline/daily-run';

function freshDb() {
  const sqlite = new Database(':memory:');
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: './lib/db/migrations' });
  return db;
}

function seedProfile(db: any) {
  db.insert(schema.companyProfile).values({
    id: 1, name: 'Acme', uei: 'X',
    naicsCodes: ['541512'], certifications: ['SB'],
    capabilities: 'IT', contactName: 'a', contactEmail: 'a@a.com',
  }).run();
}

const samOpp = {
  noticeId: 's1', title: 'Help', fullParentPathName: 'GSA',
  naicsCode: '541512', typeOfSetAsideDescription: 'Small Business',
  postedDate: '2026-05-19', responseDeadLine: '2026-12-01T17:00:00Z',
  awardCeiling: '150000', description: 'Tier 1',
};

describe('runDaily', () => {
  beforeEach(() => {
    vi.mocked(searchByProfile).mockReset();
    vi.mocked(scoreOpportunity).mockReset();
  });

  it('happy path: searches, inserts opps, scores, writes cron_run', async () => {
    const db = freshDb();
    seedProfile(db);
    vi.mocked(searchByProfile).mockResolvedValue([samOpp as any]);
    vi.mocked(scoreOpportunity).mockResolvedValue({
      fitScore: 80, recommendation: 'GO',
      naicsMatch: { matched: true, reason: '' },
      capabilityMatch: { matched: true, reason: '' },
      setasideMatch: { matched: true, reason: '' },
      keyRequirements: [], risks: [], winThemes: [],
      model: 'claude-sonnet-4-6', promptTokens: 1000, completionTokens: 200, costUsd: 0.006,
    });

    const summary = await runDaily({ db, costCapUsd: 1.0, topN: 5 });
    expect(summary.status).toBe('ok');
    expect(summary.oppsScored).toBe(1);
    const row = db.select().from(schema.opportunities).get();
    expect(row?.noticeId).toBe('s1');
    const score = db.select().from(schema.scores).get();
    expect(score?.fitScore).toBe(80);
  });

  it('stops scoring when budget exhausted, marks partial', async () => {
    const db = freshDb();
    seedProfile(db);
    vi.mocked(searchByProfile).mockResolvedValue([
      { ...samOpp, noticeId: 's1' } as any,
      { ...samOpp, noticeId: 's2' } as any,
    ]);
    vi.mocked(scoreOpportunity).mockResolvedValue({
      fitScore: 50, recommendation: 'MAYBE',
      naicsMatch: { matched: true, reason: '' },
      capabilityMatch: { matched: true, reason: '' },
      setasideMatch: { matched: true, reason: '' },
      keyRequirements: [], risks: [], winThemes: [],
      model: 'claude-sonnet-4-6', promptTokens: 1000, completionTokens: 200, costUsd: 0.80,
    });

    const summary = await runDaily({ db, costCapUsd: 1.0, topN: 5 });
    expect(summary.status).toBe('partial');
    expect(summary.oppsScored).toBe(1);
  });

  it('records failure if search throws', async () => {
    const db = freshDb();
    seedProfile(db);
    vi.mocked(searchByProfile).mockRejectedValue(new Error('SAM down'));
    const summary = await runDaily({ db, costCapUsd: 1.0, topN: 5 });
    expect(summary.status).toBe('failed');
    expect(summary.errorSummary).toMatch(/SAM down/);
  });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npm test -- tests/pipeline/daily-run.test.ts`
Expected: import error.

- [ ] **Step 3: Implement `lib/pipeline/daily-run.ts`**

```ts
import { eq, and, desc } from 'drizzle-orm';
import type { DB } from '../db/client';
import * as schema from '../db/schema';
import { searchByProfile } from '../sam/search';
import { scoreOpportunity } from '../ai/score';
import { rankCandidates } from './heuristic';
import { log as rootLog } from '../log';
import type { SamOpportunityRaw } from '../sam/schemas';

export interface RunDailyArgs {
  db: DB;
  costCapUsd: number;
  topN?: number;
  postedFromOverride?: string;
}

export interface RunSummary {
  cronRunId: number;
  status: 'ok' | 'partial' | 'failed';
  oppsFetched: number;
  oppsNew: number;
  oppsScored: number;
  totalCostUsd: number;
  errorSummary: string | null;
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function mapSamToInsert(raw: SamOpportunityRaw, now: Date): schema.NewOpportunity {
  const pop = raw.placeOfPerformance ?? null;
  const popStr = pop ? [pop.city?.name, pop.state?.code].filter(Boolean).join(', ') : null;
  return {
    noticeId: raw.noticeId,
    rawJson: raw as unknown as Record<string, unknown>,
    title: raw.title,
    agency: raw.fullParentPathName ?? '',
    naics: raw.naicsCode ?? null,
    setAside: raw.typeOfSetAsideDescription ?? null,
    postedAt: raw.postedDate ? new Date(raw.postedDate) : null,
    responseDeadline: raw.responseDeadLine ? new Date(raw.responseDeadLine) : null,
    awardCeiling: raw.awardCeiling != null ? Math.round(Number(raw.awardCeiling)) : null,
    placeOfPerformance: popStr,
    description: raw.description ?? null,
    firstSeenAt: now,
    lastSyncedAt: now,
    status: 'new',
  };
}

export async function runDaily(args: RunDailyArgs): Promise<RunSummary> {
  const { db, costCapUsd, topN = 10 } = args;
  const startedAt = new Date();
  const logs: Array<{ ts: number; level: string; msg: string; ctx?: unknown }> = [];
  const log = (level: 'info' | 'warn' | 'error', msg: string, ctx?: unknown) => {
    logs.push({ ts: Date.now(), level, msg, ctx });
    rootLog[level]({ ctx }, msg);
  };

  const cronRow = db
    .insert(schema.cronRuns)
    .values({ startedAt, status: 'running', costCapUsd, logs: [] })
    .returning()
    .get();
  const cronRunId = cronRow.id;

  let oppsFetched = 0;
  let oppsNew = 0;
  let oppsScored = 0;
  let totalCostUsd = 0;
  let status: RunSummary['status'] = 'ok';
  let errorSummary: string | null = null;

  try {
    const profile = db.select().from(schema.companyProfile).where(eq(schema.companyProfile.id, 1)).get();
    if (!profile) throw new Error('No company profile configured');

    const lastSuccess = db
      .select()
      .from(schema.cronRuns)
      .where(eq(schema.cronRuns.status, 'ok'))
      .orderBy(desc(schema.cronRuns.finishedAt))
      .limit(1)
      .get();

    const postedFrom = args.postedFromOverride
      ?? (lastSuccess?.finishedAt ? ymd(new Date(lastSuccess.finishedAt.getTime())) : ymd(new Date(Date.now() - 7 * 86400_000)));

    log('info', 'Searching SAM', { postedFrom, naics: profile.naicsCodes });
    const samOpps = await searchByProfile({
      naicsCodes: profile.naicsCodes,
      postedFrom,
      maxAwardCeiling: 350_000,
    });
    oppsFetched = samOpps.length;

    const now = new Date();
    for (const raw of samOpps) {
      const existing = db.select().from(schema.opportunities).where(eq(schema.opportunities.noticeId, raw.noticeId)).get();
      if (existing) {
        db.update(schema.opportunities)
          .set({ lastSyncedAt: now, rawJson: raw as any, responseDeadline: raw.responseDeadLine ? new Date(raw.responseDeadLine) : existing.responseDeadline })
          .where(eq(schema.opportunities.noticeId, raw.noticeId))
          .run();
      } else {
        db.insert(schema.opportunities).values(mapSamToInsert(raw, now)).run();
        oppsNew++;
      }
    }

    const allOpps = db.select().from(schema.opportunities).all();
    // Drop ones already scored at the current profile version.
    const alreadyScoredIds = new Set(
      db
        .select({ id: schema.scores.opportunityId })
        .from(schema.scores)
        .where(eq(schema.scores.profileVersion, profile.version))
        .all()
        .map((r) => r.id),
    );
    const eligible = allOpps.filter((o) => !alreadyScoredIds.has(o.noticeId));
    const ranked = rankCandidates(eligible, profile).slice(0, topN);
    log('info', 'Ranked candidates', { eligible: eligible.length, taking: ranked.length });

    for (const opp of ranked) {
      if (totalCostUsd >= costCapUsd) {
        log('warn', 'Cost cap reached, stopping', { totalCostUsd, costCapUsd });
        status = 'partial';
        break;
      }
      try {
        const scored = await scoreOpportunity(opp, profile);
        db.insert(schema.scores).values({
          opportunityId: opp.noticeId,
          profileVersion: profile.version,
          fitScore: scored.fitScore,
          recommendation: scored.recommendation,
          naicsMatch: scored.naicsMatch,
          capabilityMatch: scored.capabilityMatch,
          setasideMatch: scored.setasideMatch,
          keyRequirements: scored.keyRequirements,
          risks: scored.risks,
          winThemes: scored.winThemes,
          model: scored.model,
          promptTokens: scored.promptTokens,
          completionTokens: scored.completionTokens,
          costUsd: scored.costUsd,
          createdAt: new Date(),
        }).run();
        totalCostUsd += scored.costUsd;
        oppsScored++;
        log('info', 'Scored', { noticeId: opp.noticeId, fit: scored.fitScore, costUsd: scored.costUsd });
      } catch (err) {
        log('error', 'Scoring failed', { noticeId: opp.noticeId, err: String(err) });
        status = status === 'ok' ? 'partial' : status;
      }
    }
  } catch (err) {
    status = 'failed';
    errorSummary = String(err);
    log('error', 'Run failed', { err: errorSummary });
  }

  const finishedAt = new Date();
  db.update(schema.cronRuns)
    .set({
      finishedAt,
      status,
      oppsFetched,
      oppsNew,
      oppsScored,
      totalCostUsd,
      errorSummary,
      logs,
    })
    .where(eq(schema.cronRuns.id, cronRunId))
    .run();

  return { cronRunId, status, oppsFetched, oppsNew, oppsScored, totalCostUsd, errorSummary };
}
```

- [ ] **Step 4: Run, verify pass**

Run: `npm test -- tests/pipeline/daily-run.test.ts`
Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Add daily-run pipeline with cost cap, dedupe, profile-version gating"
```

---

## Task 14: `/api/profile` route

**Files:**
- Create: `app/api/profile/route.ts`
- Test: `tests/api/profile.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// tests/api/profile.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from '@/lib/db/schema';

const memDb = (() => {
  const sqlite = new Database(':memory:');
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: './lib/db/migrations' });
  return db;
})();

vi.mock('@/lib/db/client', () => ({ db: memDb, schema }));

import { GET, PUT } from '@/app/api/profile/route';

describe('/api/profile', () => {
  it('GET returns 404 when no profile', async () => {
    const res = await GET();
    expect(res.status).toBe(404);
  });

  it('PUT creates a profile and GET returns it', async () => {
    const req = new Request('http://localhost/api/profile', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Acme', uei: 'UEI1', naicsCodes: ['541512'],
        certifications: ['SB'], capabilities: 'IT',
        contactName: 'a', contactEmail: 'a@a.com',
      }),
    });
    const putRes = await PUT(req);
    expect(putRes.status).toBe(200);
    const body = await putRes.json();
    expect(body.version).toBe(1);

    const getRes = await GET();
    expect(getRes.status).toBe(200);
    expect((await getRes.json()).name).toBe('Acme');
  });

  it('PUT bumps version on update', async () => {
    const req = new Request('http://localhost/api/profile', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Acme2', uei: 'UEI1', naicsCodes: ['541511'],
        certifications: ['SB'], capabilities: 'IT2',
        contactName: 'a', contactEmail: 'a@a.com',
      }),
    });
    const res = await PUT(req);
    const body = await res.json();
    expect(body.version).toBe(2);
  });

  it('PUT rejects invalid body', async () => {
    const req = new Request('http://localhost/api/profile', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: '' }),
    });
    const res = await PUT(req);
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npm test -- tests/api/profile.test.ts`
Expected: import error.

- [ ] **Step 3: Implement `app/api/profile/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db, schema } from '@/lib/db/client';

const ProfileInput = z.object({
  name: z.string().min(1),
  uei: z.string().min(1),
  cageCode: z.string().nullish(),
  naicsCodes: z.array(z.string().regex(/^\d{6}$/)).min(1),
  certifications: z.array(z.string()),
  capabilities: z.string().min(1),
  contactName: z.string().min(1),
  contactEmail: z.string().email(),
  contactPhone: z.string().nullish(),
});

export async function GET() {
  const row = db.select().from(schema.companyProfile).where(eq(schema.companyProfile.id, 1)).get();
  if (!row) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json(row);
}

export async function PUT(req: Request) {
  const raw = await req.json().catch(() => null);
  const parsed = ProfileInput.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid', issues: parsed.error.issues }, { status: 400 });
  }
  const input = parsed.data;
  const existing = db.select().from(schema.companyProfile).where(eq(schema.companyProfile.id, 1)).get();
  const now = new Date();

  if (!existing) {
    const inserted = db
      .insert(schema.companyProfile)
      .values({ id: 1, version: 1, updatedAt: now, ...input })
      .returning()
      .get();
    return NextResponse.json(inserted);
  }
  const updated = db
    .update(schema.companyProfile)
    .set({ ...input, version: existing.version + 1, updatedAt: now })
    .where(eq(schema.companyProfile.id, 1))
    .returning()
    .get();
  return NextResponse.json(updated);
}
```

- [ ] **Step 4: Run, verify pass**

Run: `npm test -- tests/api/profile.test.ts`
Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Add /api/profile GET/PUT with zod validation and version bump"
```

---

## Task 15: `/api/opportunities` routes

**Files:**
- Create: `app/api/opportunities/route.ts`, `app/api/opportunities/[id]/route.ts`
- Test: `tests/api/opportunities.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// tests/api/opportunities.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from '@/lib/db/schema';

const memDb = (() => {
  const sqlite = new Database(':memory:');
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: './lib/db/migrations' });
  return db;
})();
vi.mock('@/lib/db/client', () => ({ db: memDb, schema }));

import { GET as listOpps } from '@/app/api/opportunities/route';
import { GET as getOpp, PATCH as patchOpp } from '@/app/api/opportunities/[id]/route';

beforeEach(() => {
  memDb.delete(schema.scores).run();
  memDb.delete(schema.opportunities).run();
  const now = new Date();
  memDb.insert(schema.opportunities).values([
    { noticeId: 'a', rawJson: {}, title: 'A', agency: 'GSA', naics: '541512', firstSeenAt: now, lastSyncedAt: now, status: 'new' },
    { noticeId: 'b', rawJson: {}, title: 'B', agency: 'GSA', naics: '999', firstSeenAt: now, lastSyncedAt: now, status: 'shortlisted' },
  ]).run();
});

describe('/api/opportunities', () => {
  it('GET list returns all opps', async () => {
    const req = new Request('http://x/api/opportunities');
    const res = await listOpps(req);
    expect((await res.json()).length).toBe(2);
  });

  it('GET list filters by status', async () => {
    const req = new Request('http://x/api/opportunities?status=shortlisted');
    const res = await listOpps(req);
    const body = await res.json();
    expect(body.length).toBe(1);
    expect(body[0].noticeId).toBe('b');
  });

  it('GET :id returns 404 for unknown', async () => {
    const res = await getOpp(new Request('http://x'), { params: Promise.resolve({ id: 'zzz' }) });
    expect(res.status).toBe(404);
  });

  it('PATCH :id updates status', async () => {
    const req = new Request('http://x', { method: 'PATCH', body: JSON.stringify({ status: 'bidding' }), headers: { 'content-type': 'application/json' } });
    const res = await patchOpp(req, { params: Promise.resolve({ id: 'a' }) });
    expect(res.status).toBe(200);
    const fresh = memDb.select().from(schema.opportunities).all().find((r) => r.noticeId === 'a');
    expect(fresh?.status).toBe('bidding');
  });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npm test -- tests/api/opportunities.test.ts`
Expected: import error.

- [ ] **Step 3: Implement `app/api/opportunities/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { db, schema } from '@/lib/db/client';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';

const QuerySchema = z.object({
  status: z.enum(['new', 'reviewed', 'shortlisted', 'bidding', 'submitted', 'passed']).optional(),
  naics: z.string().optional(),
  minScore: z.coerce.number().int().min(0).max(100).optional(),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_query' }, { status: 400 });
  const q = parsed.data;

  const conds = [];
  if (q.status) conds.push(eq(schema.opportunities.status, q.status));
  if (q.naics) conds.push(eq(schema.opportunities.naics, q.naics));

  const rows = db
    .select()
    .from(schema.opportunities)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(schema.opportunities.firstSeenAt))
    .all();

  // Attach latest score per row.
  const enriched = rows.map((o) => {
    const score = db
      .select()
      .from(schema.scores)
      .where(eq(schema.scores.opportunityId, o.noticeId))
      .orderBy(desc(schema.scores.createdAt))
      .limit(1)
      .get();
    return { ...o, latestScore: score ?? null };
  });

  const filtered = q.minScore != null
    ? enriched.filter((r) => (r.latestScore?.fitScore ?? -1) >= q.minScore!)
    : enriched;

  return NextResponse.json(filtered);
}
```

- [ ] **Step 4: Implement `app/api/opportunities/[id]/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { db, schema } from '@/lib/db/client';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';

const PatchSchema = z.object({
  status: z.enum(['new', 'reviewed', 'shortlisted', 'bidding', 'submitted', 'passed']),
});

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const opp = db.select().from(schema.opportunities).where(eq(schema.opportunities.noticeId, id)).get();
  if (!opp) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const scores = db.select().from(schema.scores).where(eq(schema.scores.opportunityId, id)).orderBy(desc(schema.scores.createdAt)).all();
  const docs = db.select().from(schema.documents).where(eq(schema.documents.opportunityId, id)).orderBy(desc(schema.documents.createdAt)).all();
  return NextResponse.json({ opportunity: opp, scores, documents: docs });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const updated = db
    .update(schema.opportunities)
    .set({ status: parsed.data.status })
    .where(eq(schema.opportunities.noticeId, id))
    .returning()
    .get();
  if (!updated) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json(updated);
}
```

- [ ] **Step 5: Run, verify pass**

Run: `npm test -- tests/api/opportunities.test.ts`
Expected: 4 passed.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Add /api/opportunities list and detail/PATCH routes"
```

---

## Task 16: `/api/opportunities/[id]/score` and `/docs`

**Files:**
- Create: `app/api/opportunities/[id]/score/route.ts`, `app/api/opportunities/[id]/docs/route.ts`
- Test: `tests/api/opp-actions.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// tests/api/opp-actions.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from '@/lib/db/schema';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

const memDb = (() => {
  const sqlite = new Database(':memory:');
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: './lib/db/migrations' });
  return db;
})();
vi.mock('@/lib/db/client', () => ({ db: memDb, schema }));
vi.mock('@/lib/ai/score', () => ({ scoreOpportunity: vi.fn() }));
vi.mock('@/lib/ai/docs', () => ({ generateDoc: vi.fn() }));
vi.mock('@/lib/docs/render', () => ({ renderMarkdownToPdf: vi.fn() }));

import { scoreOpportunity } from '@/lib/ai/score';
import { generateDoc } from '@/lib/ai/docs';
import { renderMarkdownToPdf } from '@/lib/docs/render';
import { POST as scorePost } from '@/app/api/opportunities/[id]/score/route';
import { POST as docPost } from '@/app/api/opportunities/[id]/docs/route';

beforeEach(() => {
  memDb.delete(schema.documents).run();
  memDb.delete(schema.scores).run();
  memDb.delete(schema.opportunities).run();
  memDb.delete(schema.companyProfile).run();
  memDb.insert(schema.companyProfile).values({
    id: 1, name: 'Acme', uei: 'X', naicsCodes: ['541512'], certifications: ['SB'],
    capabilities: 'IT', contactName: 'a', contactEmail: 'a@a.com',
  }).run();
  const now = new Date();
  memDb.insert(schema.opportunities).values({
    noticeId: 'n1', rawJson: {}, title: 't', agency: 'a', naics: '541512',
    firstSeenAt: now, lastSyncedAt: now, status: 'new',
  }).run();
});

describe('opportunity actions', () => {
  it('POST /score writes a score row', async () => {
    vi.mocked(scoreOpportunity).mockResolvedValue({
      fitScore: 70, recommendation: 'MAYBE',
      naicsMatch: { matched: true, reason: '' },
      capabilityMatch: { matched: true, reason: '' },
      setasideMatch: { matched: true, reason: '' },
      keyRequirements: [], risks: [], winThemes: [],
      model: 'claude-sonnet-4-6', promptTokens: 100, completionTokens: 50, costUsd: 0.001,
    });
    const res = await scorePost(new Request('http://x', { method: 'POST' }), { params: Promise.resolve({ id: 'n1' }) });
    expect(res.status).toBe(200);
    expect(memDb.select().from(schema.scores).all()).toHaveLength(1);
  });

  it('POST /docs writes markdown + pdf and returns id', async () => {
    process.env.PDF_OUTPUT_DIR = os.tmpdir();
    vi.mocked(generateDoc).mockResolvedValue({
      markdown: '# Hi', model: 'claude-sonnet-4-6',
      promptTokens: 1, completionTokens: 1, costUsd: 0,
    });
    vi.mocked(renderMarkdownToPdf).mockResolvedValue(Buffer.from('%PDF-fake'));
    const res = await docPost(
      new Request('http://x', { method: 'POST', body: JSON.stringify({ kind: 'analysis' }), headers: { 'content-type': 'application/json' } }),
      { params: Promise.resolve({ id: 'n1' }) },
    );
    expect(res.status).toBe(200);
    const doc = memDb.select().from(schema.documents).get();
    expect(doc?.kind).toBe('analysis');
    expect(fs.existsSync(doc!.pdfPath)).toBe(true);
  });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npm test -- tests/api/opp-actions.test.ts`
Expected: import error.

- [ ] **Step 3: Implement `app/api/opportunities/[id]/score/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db, schema } from '@/lib/db/client';
import { scoreOpportunity } from '@/lib/ai/score';

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const opp = db.select().from(schema.opportunities).where(eq(schema.opportunities.noticeId, id)).get();
  if (!opp) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const profile = db.select().from(schema.companyProfile).where(eq(schema.companyProfile.id, 1)).get();
  if (!profile) return NextResponse.json({ error: 'no_profile' }, { status: 400 });

  const scored = await scoreOpportunity(opp, profile);
  const inserted = db.insert(schema.scores).values({
    opportunityId: opp.noticeId,
    profileVersion: profile.version,
    fitScore: scored.fitScore,
    recommendation: scored.recommendation,
    naicsMatch: scored.naicsMatch,
    capabilityMatch: scored.capabilityMatch,
    setasideMatch: scored.setasideMatch,
    keyRequirements: scored.keyRequirements,
    risks: scored.risks,
    winThemes: scored.winThemes,
    model: scored.model,
    promptTokens: scored.promptTokens,
    completionTokens: scored.completionTokens,
    costUsd: scored.costUsd,
    createdAt: new Date(),
  }).returning().get();
  return NextResponse.json(inserted);
}
```

- [ ] **Step 4: Implement `app/api/opportunities/[id]/docs/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import path from 'node:path';
import fs from 'node:fs/promises';
import { z } from 'zod';
import { db, schema } from '@/lib/db/client';
import { generateDoc } from '@/lib/ai/docs';
import { renderMarkdownToPdf } from '@/lib/docs/render';

const Body = z.object({
  kind: z.enum(['capability', 'analysis', 'proposal', 'compliance_matrix']),
});

const OUT_DIR = () => process.env.PDF_OUTPUT_DIR ?? path.join(process.cwd(), 'data', 'pdfs');

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const opp = db.select().from(schema.opportunities).where(eq(schema.opportunities.noticeId, id)).get();
  if (!opp) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const profile = db.select().from(schema.companyProfile).where(eq(schema.companyProfile.id, 1)).get();
  if (!profile) return NextResponse.json({ error: 'no_profile' }, { status: 400 });

  const out = await generateDoc(parsed.data.kind, opp, profile);
  const pdf = await renderMarkdownToPdf(out.markdown);

  const outDir = OUT_DIR();
  await fs.mkdir(outDir, { recursive: true });
  const filename = `${id}-${parsed.data.kind}-${Date.now()}.pdf`;
  const pdfPath = path.join(outDir, filename);
  await fs.writeFile(pdfPath, pdf);

  const inserted = db.insert(schema.documents).values({
    opportunityId: id,
    kind: parsed.data.kind,
    markdownSource: out.markdown,
    pdfPath,
    model: out.model,
    promptTokens: out.promptTokens,
    completionTokens: out.completionTokens,
    costUsd: out.costUsd,
    createdAt: new Date(),
  }).returning().get();

  return NextResponse.json(inserted);
}
```

- [ ] **Step 5: Run, verify pass**

Run: `npm test -- tests/api/opp-actions.test.ts`
Expected: 2 passed.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Add /api/opportunities/:id/score and /docs routes"
```

---

## Task 17: `/api/cron/run-daily` and `/api/cron/runs`

**Files:**
- Create: `app/api/cron/run-daily/route.ts`, `app/api/cron/runs/route.ts`
- Test: `tests/api/cron.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// tests/api/cron.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from '@/lib/db/schema';

const memDb = (() => {
  const sqlite = new Database(':memory:');
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: './lib/db/migrations' });
  return db;
})();
vi.mock('@/lib/db/client', () => ({ db: memDb, schema }));
vi.mock('@/lib/pipeline/daily-run', () => ({ runDaily: vi.fn() }));

import { runDaily } from '@/lib/pipeline/daily-run';
import { POST } from '@/app/api/cron/run-daily/route';
import { GET as listRuns } from '@/app/api/cron/runs/route';

beforeEach(() => { vi.mocked(runDaily).mockReset(); });

describe('/api/cron', () => {
  it('rejects requests without secret', async () => {
    const res = await POST(new Request('http://x', { method: 'POST' }));
    expect(res.status).toBe(401);
  });

  it('runs pipeline with correct secret', async () => {
    vi.mocked(runDaily).mockResolvedValue({
      cronRunId: 1, status: 'ok', oppsFetched: 0, oppsNew: 0, oppsScored: 0, totalCostUsd: 0, errorSummary: null,
    });
    const res = await POST(new Request('http://x', {
      method: 'POST',
      headers: { 'x-cron-secret': 'test-cron-secret' },
    }));
    expect(res.status).toBe(200);
    expect(runDaily).toHaveBeenCalled();
  });

  it('GET /runs returns history', async () => {
    memDb.insert(schema.cronRuns).values({
      startedAt: new Date(), status: 'ok', costCapUsd: 2, logs: [],
    }).run();
    const res = await listRuns();
    const body = await res.json();
    expect(body.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npm test -- tests/api/cron.test.ts`
Expected: import error.

- [ ] **Step 3: Implement `app/api/cron/run-daily/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { config } from '@/lib/config';
import { db } from '@/lib/db/client';
import { runDaily } from '@/lib/pipeline/daily-run';

function secretsMatch(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export async function POST(req: Request) {
  const provided = req.headers.get('x-cron-secret') ?? '';
  if (!secretsMatch(provided, config.cronSecret)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const summary = await runDaily({ db, costCapUsd: config.dailyCostCapUsd });
  return NextResponse.json(summary);
}
```

- [ ] **Step 4: Implement `app/api/cron/runs/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { desc } from 'drizzle-orm';
import { db, schema } from '@/lib/db/client';

export async function GET() {
  const rows = db.select().from(schema.cronRuns).orderBy(desc(schema.cronRuns.startedAt)).limit(30).all();
  return NextResponse.json(rows);
}
```

- [ ] **Step 5: Run, verify pass**

Run: `npm test -- tests/api/cron.test.ts`
Expected: 3 passed.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Add cron endpoints with constant-time secret check"
```

---

## Task 18: App shell — layout and navigation

**Files:**
- Modify: `app/layout.tsx`
- Create: `components/AppNav.tsx`

- [ ] **Step 1: Rewrite `app/layout.tsx`**

```tsx
import './globals.css';
import { AppNav } from '@/components/AppNav';

export const metadata = {
  title: 'GovContracts',
  description: 'SAT-range federal contract opportunity tracker',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <AppNav />
        <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Create `components/AppNav.tsx`**

```tsx
import Link from 'next/link';

export function AppNav() {
  return (
    <nav className="border-b">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link href="/" className="text-lg font-semibold">GovContracts</Link>
        <div className="flex gap-4 text-sm">
          <Link href="/">Dashboard</Link>
          <Link href="/opps">All opportunities</Link>
          <Link href="/profile">Profile</Link>
        </div>
      </div>
    </nav>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "Add app layout + nav"
```

---

## Task 19: `/profile` page

**Files:**
- Create: `app/profile/page.tsx`, `components/ProfileEditor.tsx`

- [ ] **Step 1: Create `components/ProfileEditor.tsx`**

```tsx
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type ProfileForm = {
  name: string;
  uei: string;
  cageCode: string;
  naicsCodes: string;
  certifications: string;
  capabilities: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
};

export function ProfileEditor({ initial }: { initial: Partial<ProfileForm> }) {
  const [form, setForm] = useState<ProfileForm>({
    name: '', uei: '', cageCode: '', naicsCodes: '', certifications: '',
    capabilities: '', contactName: '', contactEmail: '', contactPhone: '',
    ...initial,
  });
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setStatus('saving'); setError(null);
    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ...form,
        naicsCodes: form.naicsCodes.split(',').map((s) => s.trim()).filter(Boolean),
        certifications: form.certifications.split(',').map((s) => s.trim()).filter(Boolean),
        cageCode: form.cageCode || null,
        contactPhone: form.contactPhone || null,
      }),
    });
    if (!res.ok) {
      setStatus('error');
      setError((await res.text()).slice(0, 300));
      return;
    }
    setStatus('saved');
  }

  function field<K extends keyof ProfileForm>(k: K) {
    return { value: form[k], onChange: (e: any) => setForm({ ...form, [k]: e.target.value }) };
  }

  return (
    <div className="space-y-4">
      <Input placeholder="Company name" {...field('name')} />
      <div className="grid grid-cols-2 gap-3">
        <Input placeholder="UEI" {...field('uei')} />
        <Input placeholder="CAGE code (optional)" {...field('cageCode')} />
      </div>
      <Input placeholder="NAICS codes (comma-separated, 6-digit)" {...field('naicsCodes')} />
      <Input placeholder="Certifications (comma-separated: SB, WOSB, ...)" {...field('certifications')} />
      <Textarea rows={6} placeholder="Capabilities" {...field('capabilities')} />
      <div className="grid grid-cols-2 gap-3">
        <Input placeholder="Contact name" {...field('contactName')} />
        <Input placeholder="Contact email" type="email" {...field('contactEmail')} />
      </div>
      <Input placeholder="Contact phone (optional)" {...field('contactPhone')} />
      <Button onClick={save} disabled={status === 'saving'}>
        {status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved ✓' : 'Save profile'}
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Add `Textarea` shadcn component if missing**

```bash
ls components/ui/textarea.tsx || npx shadcn@latest add textarea
```

- [ ] **Step 3: Create `app/profile/page.tsx`**

```tsx
import { db, schema } from '@/lib/db/client';
import { eq } from 'drizzle-orm';
import { ProfileEditor } from '@/components/ProfileEditor';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const row = db.select().from(schema.companyProfile).where(eq(schema.companyProfile.id, 1)).get();
  const initial = row
    ? {
        name: row.name,
        uei: row.uei,
        cageCode: row.cageCode ?? '',
        naicsCodes: row.naicsCodes.join(', '),
        certifications: row.certifications.join(', '),
        capabilities: row.capabilities,
        contactName: row.contactName,
        contactEmail: row.contactEmail,
        contactPhone: row.contactPhone ?? '',
      }
    : {};
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Company profile</h1>
        <p className="text-sm text-muted-foreground">Editing bumps profile_version. Existing scores remain but will be flagged stale.</p>
      </header>
      <ProfileEditor initial={initial} />
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "Add /profile page"
```

---

## Task 20: `/opps` and `/opps/[id]` pages

**Files:**
- Create: `app/opps/page.tsx`, `app/opps/[id]/page.tsx`, `components/OpportunityTable.tsx`, `components/ScoreBadge.tsx`, `components/OpportunityDetail.tsx`

- [ ] **Step 1: Create `components/ScoreBadge.tsx`**

```tsx
export function ScoreBadge({ score, recommendation }: { score: number | null; recommendation?: string | null }) {
  if (score == null) return <span className="text-xs text-muted-foreground">unscored</span>;
  const color =
    recommendation === 'GO' ? 'bg-green-100 text-green-900' :
    recommendation === 'NO_GO' ? 'bg-red-100 text-red-900' :
    'bg-amber-100 text-amber-900';
  return (
    <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${color}`}>
      {score} · {recommendation ?? 'MAYBE'}
    </span>
  );
}
```

- [ ] **Step 2: Create `components/OpportunityTable.tsx`**

```tsx
'use client';
import Link from 'next/link';
import { ScoreBadge } from './ScoreBadge';

type Row = {
  noticeId: string;
  title: string;
  agency: string;
  naics: string | null;
  responseDeadline: string | null;
  awardCeiling: number | null;
  status: string;
  latestScore: { fitScore: number; recommendation: string } | null;
};

export function OpportunityTable({ rows }: { rows: Row[] }) {
  return (
    <table className="w-full text-sm">
      <thead className="text-left text-muted-foreground">
        <tr>
          <th className="py-2">Title</th><th>Agency</th><th>NAICS</th>
          <th>Ceiling</th><th>Deadline</th><th>Status</th><th>Score</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.noticeId} className="border-t">
            <td className="py-2"><Link href={`/opps/${r.noticeId}`} className="font-medium hover:underline">{r.title}</Link></td>
            <td>{r.agency}</td>
            <td>{r.naics ?? '-'}</td>
            <td>{r.awardCeiling != null ? `$${r.awardCeiling.toLocaleString()}` : '-'}</td>
            <td>{r.responseDeadline ? new Date(r.responseDeadline).toLocaleDateString() : '-'}</td>
            <td>{r.status}</td>
            <td><ScoreBadge score={r.latestScore?.fitScore ?? null} recommendation={r.latestScore?.recommendation} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

- [ ] **Step 3: Create `app/opps/page.tsx`**

```tsx
import { db, schema } from '@/lib/db/client';
import { desc, eq } from 'drizzle-orm';
import { OpportunityTable } from '@/components/OpportunityTable';

export const dynamic = 'force-dynamic';

export default async function OppsPage() {
  const opps = db.select().from(schema.opportunities).orderBy(desc(schema.opportunities.firstSeenAt)).all();
  const rows = opps.map((o) => {
    const score = db.select().from(schema.scores).where(eq(schema.scores.opportunityId, o.noticeId)).orderBy(desc(schema.scores.createdAt)).limit(1).get();
    return {
      noticeId: o.noticeId,
      title: o.title,
      agency: o.agency,
      naics: o.naics,
      responseDeadline: o.responseDeadline ? o.responseDeadline.toISOString() : null,
      awardCeiling: o.awardCeiling,
      status: o.status,
      latestScore: score ? { fitScore: score.fitScore, recommendation: score.recommendation } : null,
    };
  });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">All opportunities</h1>
      <OpportunityTable rows={rows} />
    </div>
  );
}
```

- [ ] **Step 4: Create `components/OpportunityDetail.tsx`**

```tsx
'use client';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { ScoreBadge } from './ScoreBadge';

type DocKind = 'capability' | 'analysis' | 'proposal' | 'compliance_matrix';

export function OpportunityDetail({ opp, scores, documents }: any) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  async function rescore() {
    setMsg('Scoring…');
    const res = await fetch(`/api/opportunities/${opp.noticeId}/score`, { method: 'POST' });
    setMsg(res.ok ? 'Score updated. Reload page to see.' : `Failed: ${res.status}`);
  }
  async function makeDoc(kind: DocKind) {
    setMsg(`Generating ${kind}…`);
    const res = await fetch(`/api/opportunities/${opp.noticeId}/docs`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ kind }),
    });
    setMsg(res.ok ? `${kind} generated. Reload to see.` : `Failed: ${res.status}`);
  }
  async function setStatus(status: string) {
    await fetch(`/api/opportunities/${opp.noticeId}`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setMsg(`Marked ${status}.`);
  }

  const latest = scores[0];
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">{opp.title}</h1>
        <p className="text-sm text-muted-foreground">{opp.agency} · NAICS {opp.naics ?? 'n/a'} · {opp.setAside ?? 'no set-aside'}</p>
      </header>

      <section className="rounded border p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Score</h2>
          <ScoreBadge score={latest?.fitScore ?? null} recommendation={latest?.recommendation} />
        </div>
        {latest && (
          <dl className="grid grid-cols-3 gap-2 text-sm">
            <div><dt className="text-muted-foreground">NAICS</dt><dd>{latest.naicsMatch.matched ? '✓' : '✗'} {latest.naicsMatch.reason}</dd></div>
            <div><dt className="text-muted-foreground">Capability</dt><dd>{latest.capabilityMatch.matched ? '✓' : '✗'} {latest.capabilityMatch.reason}</dd></div>
            <div><dt className="text-muted-foreground">Set-aside</dt><dd>{latest.setasideMatch.matched ? '✓' : '✗'} {latest.setasideMatch.reason}</dd></div>
          </dl>
        )}
        <Button onClick={rescore} disabled={pending} variant="outline" size="sm">Re-score</Button>
      </section>

      <section className="rounded border p-4 space-y-2">
        <h2 className="font-medium">Status</h2>
        <div className="flex gap-2">
          {['new', 'reviewed', 'shortlisted', 'bidding', 'submitted', 'passed'].map((s) => (
            <Button key={s} variant={opp.status === s ? 'default' : 'outline'} size="sm" onClick={() => setStatus(s)}>{s}</Button>
          ))}
        </div>
      </section>

      <section className="rounded border p-4 space-y-2">
        <h2 className="font-medium">Documents</h2>
        <div className="flex flex-wrap gap-2">
          {(['capability', 'analysis', 'proposal', 'compliance_matrix'] as DocKind[]).map((k) => (
            <Button key={k} variant="outline" size="sm" onClick={() => makeDoc(k)}>Generate {k}</Button>
          ))}
        </div>
        <ul className="text-sm">
          {documents.map((d: any) => (
            <li key={d.id}>{d.kind} · {new Date(d.createdAt).toLocaleString()} · <span className="font-mono text-xs">{d.pdfPath}</span></li>
          ))}
        </ul>
      </section>

      <section className="rounded border p-4 space-y-2">
        <h2 className="font-medium">Description</h2>
        <pre className="whitespace-pre-wrap text-sm">{opp.description ?? '(none)'}</pre>
      </section>

      {msg && <div className="text-sm text-blue-600">{msg}</div>}
    </div>
  );
}
```

- [ ] **Step 5: Create `app/opps/[id]/page.tsx`**

```tsx
import { db, schema } from '@/lib/db/client';
import { desc, eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { OpportunityDetail } from '@/components/OpportunityDetail';

export const dynamic = 'force-dynamic';

export default async function OppDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const opp = db.select().from(schema.opportunities).where(eq(schema.opportunities.noticeId, id)).get();
  if (!opp) notFound();
  const scores = db.select().from(schema.scores).where(eq(schema.scores.opportunityId, id)).orderBy(desc(schema.scores.createdAt)).all();
  const documents = db.select().from(schema.documents).where(eq(schema.documents.opportunityId, id)).orderBy(desc(schema.documents.createdAt)).all();
  return <OpportunityDetail opp={opp} scores={scores} documents={documents} />;
}
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Add /opps list and /opps/:id detail pages"
```

---

## Task 21: Dashboard `/` — today's picks, kanban, cron card

**Files:**
- Create: `app/page.tsx`, `components/TodaysPicks.tsx`, `components/PipelineKanban.tsx`, `components/CronRunCard.tsx`

- [ ] **Step 1: Create `components/TodaysPicks.tsx`**

```tsx
import Link from 'next/link';
import { ScoreBadge } from './ScoreBadge';

export function TodaysPicks({ picks }: { picks: Array<{ noticeId: string; title: string; agency: string; score: number; recommendation: string }> }) {
  if (picks.length === 0) {
    return <p className="text-sm text-muted-foreground">No new picks yet. Wait for the next daily run.</p>;
  }
  return (
    <ul className="divide-y">
      {picks.map((p) => (
        <li key={p.noticeId} className="flex items-center justify-between py-2">
          <div>
            <Link href={`/opps/${p.noticeId}`} className="font-medium hover:underline">{p.title}</Link>
            <p className="text-xs text-muted-foreground">{p.agency}</p>
          </div>
          <ScoreBadge score={p.score} recommendation={p.recommendation} />
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 2: Create `components/PipelineKanban.tsx`**

```tsx
import Link from 'next/link';

type Col = { status: string; rows: Array<{ noticeId: string; title: string }> };

export function PipelineKanban({ cols }: { cols: Col[] }) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {cols.map((c) => (
        <div key={c.status} className="rounded border p-3">
          <h3 className="mb-2 text-sm font-semibold capitalize">{c.status} <span className="text-muted-foreground">({c.rows.length})</span></h3>
          <ul className="space-y-1">
            {c.rows.slice(0, 8).map((r) => (
              <li key={r.noticeId} className="text-sm">
                <Link href={`/opps/${r.noticeId}`} className="hover:underline">{r.title}</Link>
              </li>
            ))}
            {c.rows.length > 8 && <li className="text-xs text-muted-foreground">+{c.rows.length - 8} more</li>}
          </ul>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create `components/CronRunCard.tsx`**

```tsx
export function CronRunCard({ run }: { run: any | null }) {
  if (!run) return <p className="text-sm text-muted-foreground">No cron runs yet.</p>;
  const icon = run.status === 'ok' ? '✓' : run.status === 'partial' ? '◐' : run.status === 'failed' ? '✗' : '⋯';
  return (
    <div className="rounded border p-3 text-sm">
      <div>
        <span className="font-semibold">{icon} {run.status}</span>
        <span className="text-muted-foreground"> · {new Date(run.startedAt).toLocaleString()}</span>
      </div>
      <div className="text-muted-foreground">
        {run.oppsFetched} fetched · {run.oppsNew} new · {run.oppsScored} scored · ${run.totalCostUsd.toFixed(2)} / ${run.costCapUsd.toFixed(2)}
      </div>
      {run.errorSummary && <div className="text-red-600">{run.errorSummary}</div>}
    </div>
  );
}
```

- [ ] **Step 4: Create `app/page.tsx`**

```tsx
import { db, schema } from '@/lib/db/client';
import { desc, eq, and } from 'drizzle-orm';
import { TodaysPicks } from '@/components/TodaysPicks';
import { PipelineKanban } from '@/components/PipelineKanban';
import { CronRunCard } from '@/components/CronRunCard';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const lastRun = db.select().from(schema.cronRuns).orderBy(desc(schema.cronRuns.startedAt)).limit(1).get();
  const lastRunStart = lastRun?.startedAt ?? new Date(Date.now() - 86400_000);

  const allOpps = db.select().from(schema.opportunities).all();
  const newSinceLastRun = allOpps.filter((o) => o.firstSeenAt.getTime() >= lastRunStart.getTime());

  const picks = newSinceLastRun
    .map((o) => {
      const s = db.select().from(schema.scores).where(eq(schema.scores.opportunityId, o.noticeId)).orderBy(desc(schema.scores.createdAt)).limit(1).get();
      return s ? { noticeId: o.noticeId, title: o.title, agency: o.agency, score: s.fitScore, recommendation: s.recommendation } : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const columns = ['new', 'shortlisted', 'bidding', 'submitted'].map((status) => ({
    status,
    rows: allOpps.filter((o) => o.status === status).map((o) => ({ noticeId: o.noticeId, title: o.title })),
  }));

  return (
    <div className="space-y-8">
      <section>
        <h1 className="mb-2 text-2xl font-semibold">Today's picks</h1>
        <TodaysPicks picks={picks} />
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Pipeline</h2>
        <PipelineKanban cols={columns} />
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Last cron run</h2>
        <CronRunCard run={lastRun} />
      </section>
    </div>
  );
}
```

- [ ] **Step 5: Smoke test the dev build**

```bash
npm run db:migrate
npm run build
```

Expected: build succeeds.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Add dashboard with picks, kanban, cron run card"
```

---

## Task 22: Security headers + sqlite externalization in `next.config.ts`

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: Replace `next.config.ts`**

```ts
import type { NextConfig } from 'next';

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none';",
  },
];

const config: NextConfig = {
  serverExternalPackages: ['better-sqlite3', '@react-pdf/renderer'],
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
};

export default config;
```

- [ ] **Step 2: Rebuild to verify**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "Add security headers, externalize better-sqlite3 and @react-pdf"
```

---

## Task 23: Dockerfile + .dockerignore

**Files:**
- Create: `Dockerfile`, `.dockerignore`

- [ ] **Step 1: Create `Dockerfile`**

```dockerfile
FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
 && npm ci \
 && apt-get purge -y python3 make g++ \
 && rm -rf /var/lib/apt/lists/*

FROM node:20-bookworm-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-bookworm-slim AS run
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=build /app/.next ./.next
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
COPY --from=build /app/public ./public
COPY --from=build /app/lib/db/migrations ./lib/db/migrations
COPY --from=build /app/lib ./lib
RUN mkdir -p /data
ENV DATABASE_URL=/data/govcontracts.db
ENV PDF_OUTPUT_DIR=/data/pdfs
EXPOSE 3000
CMD ["sh", "-c", "node -e \"require('./lib/db/migrate.ts')\" || npx tsx lib/db/migrate.ts; node node_modules/next/dist/bin/next start -p 3000"]
```

- [ ] **Step 2: Create `.dockerignore`**

```
node_modules
.next
data
.git
.github
docs
tests
.env*
*.log
```

- [ ] **Step 3: Local image build smoke test**

```bash
docker build -t govcontracts:dev .
```

Expected: build succeeds. (Skip if Docker not installed; this gets caught in Fly deploy.)

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "Add multi-stage Dockerfile with sqlite build deps"
```

---

## Task 24: `fly.toml`

**Files:**
- Create: `fly.toml`

- [ ] **Step 1: Create `fly.toml`**

```toml
app = "govcontracts"
primary_region = "iad"

[build]

[env]
  PORT = "3000"
  NODE_ENV = "production"

[[mounts]]
  source = "govcontracts_data"
  destination = "/data"

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = "stop"
  auto_start_machines = true
  min_machines_running = 0

[[vm]]
  size = "shared-cpu-1x"
  memory = "512mb"
```

- [ ] **Step 2: Document setup commands in README (deferred to Task 26).** No exec yet — this file is just config.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "Add fly.toml"
```

---

## Task 25: GitHub Actions cron workflow

**Files:**
- Create: `.github/workflows/cron.yml`

- [ ] **Step 1: Create workflow**

```yaml
name: Daily SAM run

on:
  schedule:
    - cron: '0 13 * * *'   # 13:00 UTC ≈ 9am ET
  workflow_dispatch: {}

jobs:
  trigger:
    runs-on: ubuntu-latest
    steps:
      - name: Hit cron endpoint
        run: |
          curl -fsS -X POST \
            -H "x-cron-secret: ${{ secrets.CRON_SECRET }}" \
            "${{ secrets.APP_URL }}/api/cron/run-daily" \
            -m 600
```

Secrets to set in GitHub repo: `CRON_SECRET` (matches Fly env var), `APP_URL` (e.g. `https://govcontracts.fly.dev`).

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "Add GitHub Actions daily cron workflow"
```

---

## Task 26: README rewrite, CLAUDE.md update, merge to main

**Files:**
- Modify: `README.md`, `CLAUDE.md`

- [ ] **Step 1: Rewrite `README.md`**

```md
# GovContracts Dashboard

Personal-use federal contract opportunity tracker. Each morning, pulls fresh SAM.gov opportunities matching configured NAICS codes (≤ $350k award ceiling), scores them against a company profile using Claude Sonnet 4.6, and surfaces the top picks as an inbox-style dashboard. Generates capability statements, GO/NO-GO analyses, proposal outlines, and compliance matrices on demand.

## Stack

Next.js 16 (App Router, React 19) · SQLite via better-sqlite3 + Drizzle ORM · Anthropic SDK (tool-use structured outputs) · Tailwind v4 + shadcn/ui · pino · vitest. Deployed as one Fly machine.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in keys
npm run db:migrate
npm run dev
```

Visit http://localhost:3000.

### Required env vars

| Var | Notes |
|---|---|
| `ANTHROPIC_API_KEY` | From console.anthropic.com |
| `SAM_GOV_API_KEY`   | From sam.gov account → API keys |
| `CRON_SECRET`       | 16+ char random string; matches GitHub secret |
| `DAILY_COST_CAP_USD`| Per-run AI spend cap; default 2.00 |
| `DATABASE_URL`      | Path to SQLite file; default `./data/govcontracts.db` |
| `ANTHROPIC_MODEL`   | Default `claude-sonnet-4-6` |

## Running the daily job manually

```bash
curl -X POST -H "x-cron-secret: $CRON_SECRET" http://localhost:3000/api/cron/run-daily
```

## Deploying to Fly

```bash
fly launch --no-deploy            # accept the existing fly.toml
fly volumes create govcontracts_data --size 1 --region iad
fly secrets set ANTHROPIC_API_KEY=... SAM_GOV_API_KEY=... CRON_SECRET=... DAILY_COST_CAP_USD=2.00
fly deploy
```

Then in GitHub repo settings → Secrets, add `CRON_SECRET` and `APP_URL` (e.g. `https://govcontracts.fly.dev`). The `.github/workflows/cron.yml` workflow fires daily at 13:00 UTC.

## Architecture

See `docs/superpowers/specs/2026-05-21-govcontracts-rebuild-design.md`.

## Tests

```bash
npm test                 # vitest unit + integration
```
```

- [ ] **Step 2: Create `.env.example`**

```
ANTHROPIC_API_KEY=
SAM_GOV_API_KEY=
CRON_SECRET=
DAILY_COST_CAP_USD=2.00
DATABASE_URL=./data/govcontracts.db
ANTHROPIC_MODEL=claude-sonnet-4-6
LOG_LEVEL=info
```

- [ ] **Step 3: Rewrite `CLAUDE.md`**

```md
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Next.js dev server (http://localhost:3000)
- `npm run build` / `npm start` — production build / serve
- `npm run lint` — ESLint
- `npm test` — vitest unit + integration
- `npm run db:generate` — generate a new Drizzle migration from schema diffs
- `npm run db:migrate` — apply migrations against `DATABASE_URL`
- `npm run db:studio` — drizzle-kit visual DB browser

## Required env

See `.env.example`. `lib/config.ts` validates at boot and refuses to start if anything is missing.

## Architecture

Single Next.js app, single Fly machine, single SQLite file on a Fly volume. The dashboard reads only from local SQLite; SAM.gov and Anthropic are called server-side from the daily cron pipeline. A GitHub Actions workflow hits `POST /api/cron/run-daily` daily with a shared secret.

### Module rules

- API routes are thin: `zod.parse` → call into `lib/`. No business logic.
- `lib/sam/`, `lib/ai/`, `lib/docs/` are pure I/O modules; they know nothing about the DB.
- DB access lives only in `lib/pipeline/` and `app/api/`.
- All external responses (SAM, Anthropic) are parsed through zod schemas before use.
- No `JSON.parse` of model output anywhere — Anthropic calls use tool-use for structured output.

### Pipeline cost cap

`lib/pipeline/daily-run.ts` enforces `DAILY_COST_CAP_USD` (default $2.00). Runs that exceed the cap mid-loop persist what they have and write `status='partial'`. Update cost constants in `lib/ai/client.ts` if the Anthropic model or pricing changes.

### Doc generation

Anthropic returns Markdown; `lib/docs/render.ts` renders to PDF via `@react-pdf/renderer` + a small `marked`-based token walker. Both the markdown source and the PDF path are persisted in `documents`.

### Profile versioning

Editing the company profile bumps `company_profile.version`. Scores carry the profile version they were written under, so the UI can flag stale scores without invalidating data. A pipeline run only re-scores opportunities not yet scored at the current version.

## Reference

Design spec: `docs/superpowers/specs/2026-05-21-govcontracts-rebuild-design.md`
Implementation plan: `docs/superpowers/plans/2026-05-21-govcontracts-rebuild.md`
```

- [ ] **Step 4: Final test sweep**

```bash
npm test
npm run lint
npm run build
```

All three must pass.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Rewrite README and CLAUDE.md for new architecture"
```

- [ ] **Step 6: Manual end-to-end smoke against real services**

These steps require real `ANTHROPIC_API_KEY` and `SAM_GOV_API_KEY` in `.env.local`.

```bash
npm run db:migrate
npm run dev &
sleep 5

# Create profile
curl -X PUT http://localhost:3000/api/profile \
  -H 'content-type: application/json' \
  -d '{"name":"Test Co","uei":"TESTUEI123","naicsCodes":["541512"],"certifications":["SB"],"capabilities":"IT services","contactName":"You","contactEmail":"you@example.com"}'

# Run daily pipeline
curl -X POST -H "x-cron-secret: $CRON_SECRET" http://localhost:3000/api/cron/run-daily

# Inspect
curl http://localhost:3000/api/opportunities | jq '.[0]'
curl http://localhost:3000/api/cron/runs | jq '.[0]'
```

Expected: a cron_runs row with `status: "ok"`, at least one scored opportunity (or `status: "partial"` if SAM returned nothing for the NAICS — that's OK, the plumbing works).

- [ ] **Step 7: Merge to main**

```bash
git checkout main
git merge --no-ff rebuild -m "Merge rebuild branch"
```

Push when ready: `git push origin main`.

- [ ] **Step 8: Deploy**

```bash
fly launch --no-deploy           # only if first time
fly volumes create govcontracts_data --size 1 --region iad   # only if first time
fly secrets set \
  ANTHROPIC_API_KEY=... \
  SAM_GOV_API_KEY=... \
  CRON_SECRET=... \
  DAILY_COST_CAP_USD=2.00
fly deploy
```

Set the same `CRON_SECRET` + `APP_URL` in GitHub repo secrets. The daily workflow takes over from there.

---

## Plan complete

26 tasks. The pipeline integration test in Task 13 + the full local smoke in Task 26 are the two key verification gates. If both pass, the rebuild is done.
