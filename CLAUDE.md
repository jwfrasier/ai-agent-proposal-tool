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

See `.env.example`. `lib/config.ts` validates at module evaluation and refuses to start if anything is missing. **Note:** `next build` also evaluates `lib/config.ts` transitively, so builds require either real or placeholder env values; the Dockerfile sets build-time placeholders, runtime values come from `fly secrets`.

## Architecture

Single Next.js app, single Fly machine, single SQLite file on a Fly volume. The dashboard reads only from local SQLite; SAM.gov and Anthropic are called server-side from the daily cron pipeline. A GitHub Actions workflow hits `POST /api/cron/run-daily` daily with a shared secret.

### Module rules

- API routes are thin: `zod.parse` → call into `lib/`. No business logic.
- `lib/sam/`, `lib/ai/`, `lib/docs/` are pure I/O modules; they know nothing about the DB.
- DB access lives only in `lib/pipeline/` and `app/api/`.
- All external responses (SAM, Anthropic) are parsed through zod schemas before use.
- No `JSON.parse` of model output anywhere — Anthropic calls use tool-use for structured output.

### Pipeline cost cap

`lib/pipeline/daily-run.ts` enforces `DAILY_COST_CAP_USD` (default $2.00). The check is forward-projecting: after each scored call, the next call is skipped if `totalCostUsd + lastCostUsd >= costCapUsd`. Runs that stop mid-loop persist what they have and write `status='partial'`. Update cost constants in `lib/ai/client.ts` if the Anthropic model or pricing changes.

### Doc generation

Anthropic returns Markdown; `lib/docs/render.ts` renders to PDF via `@react-pdf/renderer` + a small `marked`-based token walker (inline bold/italic stripped to plain text in this MVP). Both the markdown source and the PDF path are persisted in `documents`.

### Profile versioning

Editing the company profile bumps `company_profile.version`. Scores carry the profile version they were written under, so the UI can flag stale scores without invalidating data. A pipeline run only re-scores opportunities not yet scored at the current version.

### Tests

`vitest` only. Unit tests for pure functions; integration tests for `lib/pipeline/daily-run.ts` and API routes use an in-memory SQLite + `vi.hoisted` holder pattern to swap out the `lib/db/client` singleton.

## Reference

Design spec: `docs/superpowers/specs/2026-05-21-govcontracts-rebuild-design.md`
Implementation plan: `docs/superpowers/plans/2026-05-21-govcontracts-rebuild.md`
