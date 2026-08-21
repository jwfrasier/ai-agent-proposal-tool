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

## Response submission workflow (docs/responses/)

**A drafted response is not a sendable response.** Two near-misses in one week came from this gap, not from bad writing: the VAMC COPEweb bid was fully drafted and missed its deadline, and the DoWEA capability statement sat as markdown for 8 days and was caught 2.5 hours before its date. In both cases the prose was finished and nobody had built the artifact.

**A response is only "done" when `docs/responses/<date>-<slug>/out/` contains all three:**
1. The rendered PDF (never markdown — agencies do not accept it)
2. `EMAIL-DRAFT.md` with exact To/Cc addresses, subject line, and body
3. A verified page/format check against the notice's stated limits

Until all three exist, treat the response as **not started** regardless of how polished the markdown is.

**Always read the notice's attachments before building.** `raw_json.resourceLinks` on the SAM record holds them, and they download with plain `curl` — no API key. The SAM description field is a summary and routinely omits submission instructions, page limits, and format rules that the attached notice document specifies. The DoWEA attachment also corrected the agency's name.

**Rendering toolchain** (Times New Roman, 1in margins, Letter): `docs/responses/2026-07-30-onc-argos/build-pdf.js` is the reference implementation — Chrome via `puppeteer-core` with `marked`. When a page cap excludes the cover, render cover and body separately and merge with `merge-pdf.swift` (CoreGraphics) so the body self-numbers 1..N against the cap; a footer reading "of 11" against a 10-page limit invites a miscount. Verify the built PDF by reading the actual pages, and confirm fonts embedded and no fallback crept in:
```
python3 -c "import re;d=open(PDF,'rb').read();print(len(re.findall(rb'/Type\s*/Page[^s]',d)),[f for f in set(re.findall(rb'/BaseFont\s*/([A-Za-z0-9+,\-]+)',d)) if b'Times' not in f])"
```

**Strip internal routing headers.** Response markdown often opens with a "Submit to / Suggested subject line / Respond by" block. That is a note-to-self and must never appear in the deliverable; start the render at the first real heading.

**Querying the opportunities DB:** never `SELECT *` from `cron_runs` — the `logs` column holds large JSON blobs that flood context. Name the columns you need.

## Notice watch monitor (`npm run watch`)

**Run it at the start of any bid session and before any scheduled proposal send.** The
daily pipeline only fetches NEW notices; it is blind to changes on notices we're actively
bidding. `scripts/watch.ts` reads `watchlist.json` (notice id + label + optional
deadlineOverride/notes), follows each notice's revision chain, and alarms on: new
revisions (amendments post as NEW notice ids), cancelled/archived flag flips, deadline
changes, and added attachments — diffed against `data/watch-state.json`. Exit code 2 on
alarms. Add a notice to the watchlist the moment a bid goes active; prune after
award/submission closes out.

**SAM notice forensics (no API key needed — these are the public UI endpoints):**
- `https://sam.gov/api/prod/opps/v2/opportunities/<noticeId>` — full record. Key fields:
  `archived`/`cancelled` (booleans; a cancelled notice may still show live-looking
  content — trust the flags, verified against a control notice 2026-08-21 when the DoWEA
  RFP sat cancelled for 4 days with no cancellation text), `latest` (false ⇒ superseded),
  `parent`/`related` (revision chain), `data2.solicitation.deadlines.response`.
- `https://sam.gov/api/prod/opps/v3/opportunities/<noticeId>/resources` — attachment
  list; files download via `.../resources/files/<resourceId>/download` with plain curl.
- `https://sam.gov/api/prod/sgs/v1/search/?index=opp&q=<solnum>&sort=-modifiedDate` —
  finds the current revision id for a solicitation number (how you chase amendments).
- The keyed api.sam.gov search API often returns 0 for older postings — use the UI
  endpoints above for anything already known.

## Reference

Design spec: `docs/superpowers/specs/2026-05-21-govcontracts-rebuild-design.md`
Implementation plan: `docs/superpowers/plans/2026-05-21-govcontracts-rebuild.md`
