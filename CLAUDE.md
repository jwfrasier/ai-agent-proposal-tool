# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start Next.js dev server (http://localhost:3000)
- `npm run build` — production build
- `npm run start` — serve the production build
- `npm run lint` — ESLint (flat config in `eslint.config.mjs`, extends `next/core-web-vitals` + `next/typescript`)

No test runner is configured.

## Required env (`.env.local`)

- `OPENAI_API_KEY` — used by `lib/openai.ts`
- `SAM_GOV_API_KEY` — used by `lib/sam-api.ts`

## Architecture

Next.js 16 App Router app (React 19, Tailwind v4, shadcn/ui via Radix). The product searches SAM.gov federal contract opportunities, scores them against a company profile with OpenAI, and generates PDFs.

### Data layer — JSON files in `data/`

There is no database. `lib/storage.ts` is the single gateway to filesystem persistence; all API routes go through it. Files:

- `company-profile.json` — single company profile
- `saved-contracts.json` — opportunities the user has saved + their scores
- `sam-cache.json` — cached SAM.gov search responses (24h TTL, keyed by search params)
- `opportunity-scores-cache.json` — cached AI scores per opportunity+profile
- `agent-results.json` — history of autonomous agent runs

The 24h SAM cache (`CACHE_EXPIRY_MS` in `lib/storage.ts`) is important: SAM.gov has rate limits and quota costs, so the agent and search routes prefer cached results. When adding new SAM-touching code, route through `getCachedSearch` / `searchOpportunities` rather than calling SAM directly.

Because storage is filesystem-based, the app cannot run on serverless/read-only environments without changes.

### Request flow

- `app/api/sam/route.ts` — proxy to SAM.gov via `lib/sam-api.ts`, with file caching
- `app/api/score/route.ts` — calls `lib/openai.ts::scoreOpportunity` (GPT-based fit scoring against company profile), caches result
- `app/api/contracts/route.ts` — CRUD over saved contracts
- `app/api/company/route.ts` — get/set company profile
- `app/api/pdf/route.ts` — renders `@react-pdf/renderer` templates from `components/PDFTemplates/`
- `app/api/description/route.ts` — fetch opportunity description (SAM returns this lazily)
- `app/api/export-cache/route.ts` — CSV/JSON export of cache
- `app/api/agent/{run,runs,generate}` — autonomous agent endpoints

### Agent subsystem (`lib/agent/`)

`AgentOrchestrator` (`lib/agent/agent-orchestrator.ts`) is a multi-step workflow:

1. Search SAM (using `getCachedSearch` first)
2. `OpportunitySelector` ranks candidates heuristically
3. For each selected opp, call `scoreOpportunityWithTokens` and `generateProposalOutlineWithTokens` (token-tracked variants in `lib/openai.ts`)
4. Aggregate cost from `TokenUsage` (pricing constants `COST_PER_1M_*` are hard-coded for `gpt-4o-mini` — update if model changes)
5. Persist the run via `AgentLogger` to `agent-results.json`

Run state is the `AgentRun` type in `types/index.ts` with statuses `selecting → scoring → generating → complete | failed`. The frontend at `app/agent/page.tsx` polls `/api/agent/runs` to display progress.

### Types

`types/index.ts` is the single source of truth for `CompanyProfile`, `SamOpportunity`, `SavedContract`, `OpportunityScore`, `AgentRun`, `TokenUsage`, etc. Keep API routes, lib helpers, and components aligned to these — there's no runtime validation layer beyond zod usage in forms.

### UI conventions

- shadcn/ui in `components/ui/` (configured via `components.json`, aliases in `tsconfig.json`: `@/*` → repo root)
- Tailwind v4 via `@tailwindcss/postcss`; global styles in `app/globals.css`
- Forms use `react-hook-form` + `@hookform/resolvers/zod`
- PDF rendering happens server-side in `app/api/pdf/route.ts` using templates under `components/PDFTemplates/`

## Notes for changes

- When adding a new API route that reads/writes app data, add the helper to `lib/storage.ts` rather than touching `fs` from the route — this keeps cache TTL and directory-creation logic in one place.
- When changing OpenAI prompts or models in `lib/openai.ts`, also revisit the pricing constants in `agent-orchestrator.ts` so cost tracking stays accurate.
- Cache keys are derived from search params; if you add a new search field, update the key derivation in `lib/storage.ts` or stale cache will mask the new filter.
