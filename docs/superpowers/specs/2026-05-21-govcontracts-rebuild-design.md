# GovContracts Dashboard — Ground-up Rebuild

**Status:** Design approved, pending spec review
**Date:** 2026-05-21
**Author:** Joseph Frasier (with Claude)

## 1. Purpose

A personal tool for one user (the author) to find, evaluate, and prepare bids on federal contract opportunities from SAM.gov in the Simplified Acquisition Threshold range (≤ $350k).

Each morning, a background job pulls fresh opportunities matching the user's NAICS codes, AI-scores them against the user's company profile, and surfaces the top picks as an inbox-style dashboard. From any opportunity the user can generate four bid-prep documents: capability statement, GO/NO-GO analysis, proposal outline, compliance matrix.

The rebuild discards the existing codebase. The audit of the prior implementation surfaced 28 issues (5 critical, 7 high) spanning concurrent-write corruption in JSON file storage, SSRF in the description proxy, exposed API keys, silent agent failures, no cost cap on AI spend, and no input validation on any API route. Patching these in place would touch every file. Starting clean is cheaper.

## 2. Non-goals

- Multi-user / multi-tenant. Single hardcoded profile, no auth.
- Contracts above $350k. Past-performance modeling, FAR Part 15 compliance, and full-and-open acquisition flows are out of scope.
- Real-time SAM.gov data in the UI. The dashboard reads from local SQLite; freshness comes from the daily cron, not on-demand fetches.
- A "what-if" search UI for ad-hoc SAM exploration. If needed later, add as a separate endpoint.
- Mobile-first design. Desktop only.

## 3. Constraints

- **Dollar ceiling:** target opportunities have `award_ceiling` (or equivalent SAM field) ≤ $350,000. At this threshold past-performance records are not required for award, simplifying the documents.
- **Single deployment:** one Fly.io machine, one SQLite database file on a Fly volume. No external Postgres, no Redis, no queue service.
- **AI provider:** Anthropic Claude Sonnet 4.6 for both scoring and document drafting. Structured outputs via tool use only — no `JSON.parse` on model output anywhere.
- **Scheduling:** external. GitHub Actions cron hits a guarded HTTP endpoint. The app itself runs no background timers.
- **Cost cap:** hard per-run AI budget enforced in code (default $2.00 USD, env-configurable). Pipeline short-circuits when exceeded.

## 4. Architecture

Single Next.js 16 app, App Router, deployed as one Fly machine. SQLite on a Fly volume via `better-sqlite3` + Drizzle ORM. External services (SAM.gov, Anthropic) are reached only from server-side code; the browser never holds an API key.

```
GitHub Actions (cron: "0 13 * * *")
        │  POST /api/cron/run-daily
        │  Header: x-cron-secret
        ▼
┌─────────────────────────────────┐
│  Next.js app (Fly machine)      │
│  ┌───────────┐ ┌─────────────┐  │
│  │ UI pages  │ │ API routes  │  │
│  └─────┬─────┘ └──────┬──────┘  │
│        └──────┬───────┘         │
│               ▼                 │
│      lib/  (sam, ai, docs,      │
│             pipeline, db)       │
│               ▼                 │
│      SQLite (Fly volume)        │
└─────────────────────────────────┘
        │
        ├──► SAM.gov API
        └──► Anthropic API
```

### 4.1 Stack

- Next.js 16, React 19, TypeScript with `strict: true`
- `better-sqlite3` + Drizzle ORM + drizzle-kit migrations
- Anthropic SDK with prompt caching and tool-use structured outputs
- `zod` at every external boundary (HTTP request bodies, env vars, SAM responses)
- Tailwind v4 + shadcn/ui (existing `components/ui/` carried over)
- `pino` for structured JSON logging
- `vitest` for tests
- Markdown → PDF rendering library to be selected during implementation planning (candidates: `@react-pdf/renderer` with a markdown-to-react adapter, or `puppeteer` headless print, or `markdown-pdf`). Decision deferred — see §10.

### 4.2 Module boundaries

```
lib/
├─ db/
│  ├─ schema.ts          Drizzle table defs (source of truth for DB types)
│  ├─ client.ts          better-sqlite3 + Drizzle singleton
│  └─ migrations/        drizzle-kit generated
├─ sam/
│  ├─ client.ts          fetch wrapper: API key in header, host allowlist,
│  │                     retry+backoff on 5xx/429, zod-parses response
│  └─ search.ts          searchByProfile(profile) → SamOpportunity[]
├─ ai/
│  ├─ client.ts          Anthropic singleton, prompt caching configured
│  ├─ score.ts           scoreOpportunity(opp, profile) → Score
│  │                     (tool-use structured output; no JSON.parse)
│  └─ docs.ts            generateDoc(kind, opp, profile) → markdown
├─ docs/
│  ├─ render.ts          markdown → PDF (single function)
│  └─ templates/         capability statement template (the one static doc)
├─ pipeline/
│  └─ daily-run.ts       orchestration: search → dedupe → score → persist
├─ config.ts             env validation via zod at boot (fail-fast)
└─ log.ts                pino instance
```

**Rules:**

- `lib/sam/`, `lib/ai/`, `lib/docs/` know nothing about the DB and nothing about each other. Pure I/O modules with typed inputs and outputs.
- DB access lives only in `lib/pipeline/` and `app/api/`.
- API routes are thin adapters: `zod.parse(body)` → call lib function → return JSON. No business logic in routes.

### 4.3 API surface

```
GET    /api/opportunities                list with filters (status, score, naics, agency)
GET    /api/opportunities/:id            full detail + scores + docs
PATCH  /api/opportunities/:id            update status
POST   /api/opportunities/:id/score      on-demand re-score
POST   /api/opportunities/:id/docs       generate a doc (body: { kind })
GET    /api/profile                      read company profile
PUT    /api/profile                      update (bumps profile_version)
POST   /api/cron/run-daily               guarded by x-cron-secret header
GET    /api/cron/runs                    cron run history (last 30)
```

There is no `/api/sam/*` proxy and no client-side SAM access. The dashboard reads only from the local DB. This removes the SSRF and API-key-leak vectors from the prior implementation.

## 5. Data model

Five tables. Schema is authoritative; types are derived from Drizzle.

### 5.1 `company_profile` (single row, `id = 1`)

| Column | Type | Notes |
|---|---|---|
| id | integer PK | always 1 |
| version | integer | bumps on every update; scores reference this |
| name | text | |
| uei | text | |
| cage_code | text | nullable |
| naics_codes | json | array of strings |
| certifications | json | array of enums (SB, WOSB, SDVOSB, 8a, HUBZone, …) |
| capabilities | text | freeform pitch markdown |
| contact_name, contact_email, contact_phone | text | |
| updated_at | datetime | |

### 5.2 `opportunities`

| Column | Type | Notes |
|---|---|---|
| notice_id | text PK | SAM.gov's stable id |
| raw_json | json | full SAM payload, for re-scoring without re-fetching |
| title, agency, naics, set_aside | text | |
| posted_at, response_deadline | datetime | |
| award_ceiling | integer | dollars, nullable |
| place_of_performance | text | |
| description | text | |
| first_seen_at, last_synced_at | datetime | |
| status | enum | new \| reviewed \| shortlisted \| bidding \| submitted \| passed |

### 5.3 `scores`

| Column | Type | Notes |
|---|---|---|
| id | integer PK | |
| opportunity_id | text FK | |
| profile_version | integer | bumps with profile; UI flags stale scores |
| fit_score | integer | 0–100 |
| recommendation | enum | GO \| NO_GO \| MAYBE |
| naics_match | json | `{ matched: bool, reason: string }` |
| capability_match | json | same shape |
| setaside_match | json | same shape |
| key_requirements | json | array of strings extracted from solicitation |
| risks | json | array of strings |
| win_themes | json | array of strings |
| model | text | Anthropic model id used |
| prompt_tokens, completion_tokens | integer | |
| cost_usd | real | computed from token counts |
| created_at | datetime | |

### 5.4 `documents`

| Column | Type | Notes |
|---|---|---|
| id | integer PK | |
| opportunity_id | text FK | nullable for capability statement |
| kind | enum | capability \| analysis \| proposal \| compliance_matrix |
| markdown_source | text | single source of truth |
| pdf_path | text | file path on volume |
| model, tokens, cost_usd | | as in `scores` |
| created_at | datetime | |

### 5.5 `cron_runs`

| Column | Type | Notes |
|---|---|---|
| id | integer PK | |
| started_at, finished_at | datetime | |
| status | enum | ok \| partial \| failed |
| opps_fetched, opps_new, opps_scored | integer | |
| total_cost_usd, cost_cap_usd | real | |
| error_summary | text | nullable |
| logs | json | structured log entries from the run |

### 5.6 Rationale notes

- `profile_version` makes profile edits non-destructive: existing scores are kept but flagged stale in the UI. No mass re-score needed at edit time.
- `raw_json` on opportunities lets us re-score with new prompts or model versions without hitting SAM again. Storage cost is trivial.
- `cron_runs.logs` gives a forensic trail for "why did this opportunity not get scored?" without scraping stdout.

## 6. Daily pipeline (`lib/pipeline/daily-run.ts`)

```
1. Load profile from DB. Bail if missing.
2. For each NAICS in profile.naics_codes:
     sam.search({ naics, postedFrom: lastSuccessfulRunDate, maxValue: 350_000 })
     Cap results per NAICS at 25 (configurable).
3. Dedupe by notice_id. Upsert into opportunities:
     - new rows: status='new', first_seen_at=now
     - existing: update last_synced_at, raw_json, response_deadline
4. Pre-filter (pure code, no AI):
     - drop expired (response_deadline < now)
     - drop already-scored against current profile_version
     - prefer matching set-aside if user holds matching cert
5. Rank candidates by heuristic (NAICS exact match, set-aside fit, recency,
   value ceiling). Take top N (default 10).
6. For each candidate, in order of rank:
     - if remaining_budget <= 0: stop, mark run 'partial'
     - ai.scoreOpportunity → write to scores, decrement budget
     - if fit_score >= 70 AND status='new': also generate analysis memo
7. Write cron_runs row with full summary and structured logs.
```

**Idempotency:** safe to run multiple times per day. Step 4's "already-scored-at-current-profile-version" check prevents duplicate AI calls.

**Cost cap:** `DAILY_COST_CAP_USD` env var (default $2.00). Cost is tracked in dollars, decremented after every AI call. When exhausted, the run completes the in-flight call, persists what it has, and writes `status='partial'` with the cap value for context.

## 7. UI

Four pages, no more.

```
/                Dashboard / inbox
                 - Today's picks: 5 highest-scoring new opps since yesterday
                 - Pipeline columns (kanban): New / Shortlisted / Bidding / Submitted
                 - Last cron run summary card

/opps            Full filterable table (status, score, NAICS, agency, deadline)
/opps/:id        Detail: SAM data + score breakdown + doc generation buttons
/profile         Edit NAICS, certs, capabilities. Save bumps profile_version.
```

No separate "agent" page. The cron is plumbing; its history surfaces on `/` as a small card and on `GET /api/cron/runs` for debugging.

Existing shadcn/ui primitives in `components/ui/` are kept. All other current components are discarded and rebuilt against the new data model.

## 8. Error handling & observability

- **Boundary validation.** Every API route validates body/query with zod. Every external response (SAM, Anthropic) is parsed through a zod schema before use. Invalid → log + 4xx/5xx with sanitized message.
- **Structured AI output.** Anthropic calls use tool use; the SDK guarantees output matches the schema. There is no `JSON.parse` of model output in the codebase.
- **Retries.** `lib/sam/client.ts` retries 5xx and 429 with exponential backoff (max 3 attempts, base 500ms). Anthropic SDK's built-in retry is configured `maxRetries: 2`.
- **Logging.** `pino` writes JSON to stdout. Fly captures it. Every cron run also persists its log array to `cron_runs.logs`. No `console.log` in prod paths.
- **Secrets.** `lib/config.ts` validates `ANTHROPIC_API_KEY`, `SAM_GOV_API_KEY`, `CRON_SECRET`, `DAILY_COST_CAP_USD` (and any other env) at boot via zod. App refuses to start if any are missing or malformed.
- **No client-side keys.** API routes are the only thing that talks to external services. The browser bundle has no SAM or Anthropic credentials.
- **Cron auth.** `POST /api/cron/run-daily` requires `x-cron-secret` header matching `CRON_SECRET`. Constant-time comparison.
- **Security headers.** `next.config.ts` sets sane defaults: HSTS, X-Content-Type-Options, Referrer-Policy, restrictive CSP.

## 9. Testing

`vitest`, two tiers, narrow scope.

- **Unit:** pure functions in `lib/sam/` (parse, retry), `lib/ai/` (prompt assembly, cost calc with mocked client), `lib/docs/render.ts`, the heuristic pre-filter in `pipeline/`.
- **Integration:** `pipeline/daily-run.ts` against a temp SQLite + recorded SAM fixtures + a mock Anthropic. Three scenarios: happy path, budget exceeded mid-run, SAM 5xx with retries exhausted.
- **No E2E.** Personal tool; manual smoke covers the UI.

## 10. Open questions deferred to implementation planning

1. **PDF rendering library.** Three candidates (`@react-pdf/renderer` + markdown adapter; headless `puppeteer`; `markdown-pdf`). Decision criteria: output quality on a government-style 1-pager, dependency footprint, ability to render on a small Fly machine without Chromium bloat. Resolve in the writing-plans phase.
2. **Exact heuristic weights** in pipeline step 5. Start with NAICS-exact = 50, set-aside = 30, recency = 10, ceiling-fit = 10; tune after first week of real data.
3. **Today's-picks recency window.** "5 highest-scoring new opps" — new since when? Last 24h or last cron run? Default to last cron run, revisit if it feels too narrow.

## 11. Migration strategy

Not incremental. The audit showed too many cross-cutting issues for selective rewrite to be cheaper than starting clean.

**Throwaway list:**
- `data/*.json` (no import; user opted for clean start)
- `lib/storage.ts`, `lib/openai.ts`, `lib/sam-api.ts`, `lib/agent/*`, `lib/pdf-generator.ts`
- All current API routes under `app/api/`
- All custom components except `components/ui/*`
- `app/agent/`, `app/contracts/`, `app/company/`, current `app/page.tsx`
- All current `types/index.ts` (regenerated from Drizzle schema)

**Carries over:**
- `components/ui/*` (shadcn primitives)
- `app/globals.css`, Tailwind config, PostCSS config
- `tsconfig.json` (verify `strict: true`)
- `next.config.ts` (extended with security headers)

**Execution:**
- Work on a branch.
- First commit: delete throwaway list. Branch will not build during this period.
- Subsequent commits build up the new structure module by module: `lib/config.ts` → `lib/db` → `lib/sam` → `lib/ai` → `lib/docs` → `lib/pipeline` → API routes → UI.
- Final commit: deploy config (`fly.toml`, GitHub Actions cron workflow).
- Merge to main only when daily-run pipeline integration tests pass and a manual smoke against real SAM + Anthropic produces a sensible scored opportunity.

## 12. Success criteria

The rebuild is done when:

1. A fresh `fly deploy` brings up a working app with an empty DB.
2. `PUT /api/profile` with a real profile succeeds and bumps `version`.
3. `POST /api/cron/run-daily` with the right secret fetches real SAM opps for the profile's NAICS, scores up to 10 against the profile, and writes a `cron_runs` row.
4. `/` shows the scored opps with a working kanban.
5. From `/opps/:id`, all four document kinds generate and download as PDFs.
6. Vitest unit + integration suites pass in CI.
7. Zero `console.log`, zero `JSON.parse` of model output, zero plaintext API keys in URLs, zero `any` in `lib/`.
