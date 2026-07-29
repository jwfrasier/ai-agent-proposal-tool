# Design: Two-Stage Scoring Cost Optimization

**Date:** 2026-07-29
**Status:** Approved (design), pending spec review
**Area:** `lib/pipeline/daily-run.ts`, `lib/screening/screen.ts`, `lib/ai/`

## Problem

The daily pipeline Sonnet-scores every opportunity that survives the free
deterministic screen, at ~$0.02 each (avg 2,782 input / 797 output tokens,
`claude-sonnet-4-6`). Three concrete cost defects make this "bloated and
expensive":

1. **No solicitation-number dedup.** `daily-run.ts` dedups only on `noticeId`,
   so SAM reposts of the same solicitation are stored and re-scored. Audit
   (2026-07-28): `47QSMD20R0001` appeared 30×; **$1.64 of $5.79 lifetime AI
   spend (28%) went to duplicate solicitations.**
2. **Every survivor pays Sonnet.** There is no cheap triage tier; a slam-dunk
   NO_GO costs the same as a genuine candidate.
3. **Fat inputs.** The full raw description (HTML/boilerplate) is sent to Sonnet,
   inflating the dominant (input) token cost.

Impact today: **329 opportunities are unscored at profile v2.** A run would
attempt all 329 at ~$0.02 = **~$6.60**, blow through the $2 cap, and stop
`partial`. The backlog cannot be cleared under the current design.

Two known false-negative screen rules also leak junk into paid scoring
(bundle notice-type literal; missing `"annual license"` commodity pattern), and
crashed runs leave `cron_runs.status='running'` with `total_cost_usd=0` even
though score rows and real spend exist — under-reporting cost and, because the
cap is enforced per run, risking overspend across a crash loop.

## Goal

Score the backlog and daily new-ingest **~60% cheaper** while preserving
Sonnet-quality judgment on real candidates, and make the run's cost observable
before it commits the expensive tier.

Non-goals: re-scoring the existing 360 v2 scores (already Sonnet-quality; no
change), changing the score output schema (UI compatibility), or the broader
screener-bug backlog beyond the two items named here.

## Architecture — three cheapest-first layers

The score decision for each opportunity flows through three gates. Each gate
only pays for what the previous one could not decide for free.

```
opportunity
  │
  ▼  Layer 1: deterministic gate (free)
  ├─ solicitation-number dedup ───────► skip, persist `dup:<solnum>` marker row
  ├─ screen auto_pass (slam-dunk) ────► persist synthetic `screen:` score row
  ├─ screen reject rules ─────────────► (existing behavior)
  │
  ▼  Layer 2: Haiku triage (cheap)
  ├─ verdict = 'reject' (confident NO_GO) ─► persist `triage:haiku` score row
  │
  ▼  Layer 3: Sonnet full score (unchanged quality, trimmed input)
  └─ verdict = 'advance' ──────────────► full score row (existing schema)
```

### Layer 1 — Deterministic gate (free)

**Solicitation-number dedup.** Extend the existing "already scored" set logic in
`daily-run.ts`. Before scoring, build a set of `solicitationNumber`s already
scored at the current profile version. Skip any opportunity whose
`raw_json.solicitationNumber` is a non-empty member of that set (and is not the
opportunity that owns that score). Persist a zero-cost marker row
(`model = 'dup:<solnum>'`) so the skip is auditable and not re-evaluated.

- Guard: many `solicitationNumber` values are missing or malformed; only dedup
  on a **non-empty, exact-match** value. Never dedup on `noticeId` (already
  handled) or on blank.

**Screen-rule fixes** in `lib/screening/screen.ts`:
- Replace the `NON_BIDDABLE_NOTICE_TYPES` bundle literal
  `'Intent to Bundle Requirements (DoD-Funded)'` with the value SAM actually
  returns: `'Consolidate/(Substantially) Bundle'`. (Keep the old string too if
  cheap, to be safe.)
- Add `"annual license"` to the commodity_license patterns (currently covers
  `annual subscription`, `license renewal`, etc.).

### Layer 2 — Haiku triage (cheap, new)

A new module `lib/ai/triage.ts` exposes `triageOpportunity(opp, profile)`:

- Uses **`claude-haiku-4-5-20251001`** via structured **tool-use** (no
  `JSON.parse` of model output). Tool schema returns
  `{ verdict: 'advance' | 'reject', reason: string }`.
- **Conservative prompt:** reject ONLY a confident NO_GO — wrong lane, clearly
  over the SAT ceiling, commodity/hardware, or plainly not IT services/software.
  Anything ambiguous or borderline → `advance`. The cost of a wrong `advance` is
  one Sonnet call; the cost of a wrong `reject` is a missed lead, so the bias is
  explicitly toward `advance`.
- Input is the **trimmed** opportunity view (see Layer 3 trimming), keeping the
  triage call itself cheap.
- Returns cost (`costFor(...)`) like `scoreOpportunity` so it counts against the
  run's cost accounting and cap.

In `daily-run.ts`, triage runs for every opportunity that reaches the paid tier
(screen disposition `clear` or `flag`). On `reject`, persist a `triage:haiku`
score row (mirroring `screenedOutScore`: records reason + Haiku cost, no Sonnet
call) and continue. On `advance`, proceed to Layer 3.

### Layer 3 — Sonnet full score (unchanged output, trimmed input)

- Only triage-`advance` opportunities are scored by Sonnet, via the existing
  `scoreOpportunity` — **same output schema**, so existing scores and the UI are
  unaffected.
- **Description trimming:** a small pure helper `trimForScoring(description)`
  (in `lib/ai/` or `lib/pipeline/`) strips obvious HTML/boilerplate and truncates
  to a sane max (e.g. ~1,200 tokens' worth of chars) with an ellipsis marker.
  Used for BOTH triage and Sonnet input. Pure function → unit-tested.

## Cost observability — pre-Sonnet projection gate

Because the operator wants to decide the cap "after dry-run numbers," the run
reports projected Sonnet spend **before** committing to Layer 3:

- After Layer 1 + Layer 2 complete for the candidate set, the run knows the
  count of `advance` opportunities. It logs a projection:
  `projected_sonnet_cost ≈ advanceCount × recentAvgSonnetCost` (avg from the
  last N Sonnet score rows, fallback to $0.0203) plus triage cost already spent.
- A run parameter `triageOnly?: boolean` (default `false`) stops the run after
  Layer 2, persisting triage/dedup rows and the projection, WITHOUT any Sonnet
  spend. This is the "dry run": operator inspects projected cost, then re-runs
  with a chosen `costCapUsd` to let Sonnet proceed (triage rows already persisted
  are not recomputed).
- Normal (`triageOnly=false`) runs proceed straight through, still governed by
  the existing forward-projecting per-call cap check.

## Crashed-run accounting fix

In `daily-run.ts` run lifecycle:
- Wrap the run body so that on **any** exit path (success, cap-stop, thrown
  error) the `cron_runs` row is finalized with the real `total_cost_usd`
  accumulated so far and a terminal `status` (`ok` | `partial` | `error`) —
  never left at `running`. Use try/finally around the scoring loop.
- On startup, optionally mark any pre-existing `status='running'` rows older than
  a threshold as `error` (stale-run reaper) so the dashboard/accounting is
  correct. (Small, optional; include if cheap.)

## Data / persistence

No schema migration required. New rows reuse the `scores` table with distinct
`model` sentinels, consistent with the existing `screen:*` convention:
- `dup:<solnum>` — deduped, zero cost.
- `triage:haiku` — triage-rejected, Haiku cost recorded.
- `claude-sonnet-4-6` — full score (unchanged).

This keeps every disposition auditable in one place and prevents re-processing.
Marker rows populate the `scores` table's NOT NULL columns (recommendation,
naics_match, capability_match, setaside_match, key_requirements, risks,
win_themes, token counts, cost) with sentinel/empty values exactly as the
existing `screenedOutScore` synthetic rows already do — reuse that helper's
shape.

## Module boundaries

- `lib/screening/screen.ts` — deterministic rules only (pure). +2 rule fixes.
- `lib/ai/triage.ts` — NEW. Haiku triage via tool-use. Pure I/O, no DB. Mirrors
  `lib/ai/score.ts` shape.
- `lib/ai/` trimming helper — pure, unit-tested.
- `lib/pipeline/daily-run.ts` — orchestration: dedup set, triage gate, projection
  log, `triageOnly` short-circuit, try/finally run finalization. DB access stays
  here per existing module rules.

## Testing (vitest, existing patterns)

- **Unit:** `trimForScoring` (boilerplate strip, truncation, idempotency);
  solicitation-dedup set logic (blank/malformed guard); screen-rule fixes
  (bundle string, `"annual license"` now rejected).
- **Triage:** `triageOpportunity` with a mocked Anthropic client — asserts
  tool-use path, conservative `advance` on ambiguous input, cost returned.
- **Integration** (`daily-run.ts`, in-memory SQLite + `vi.hoisted` holder):
  - Duplicate solicitation → second occurrence gets `dup:` row, no Sonnet call.
  - Triage `reject` → `triage:haiku` row, no Sonnet call; `advance` → Sonnet
    call happens.
  - `triageOnly=true` → no Sonnet calls, projection logged, triage rows persisted.
  - Thrown error mid-loop → `cron_runs` finalized with real cost and non-`running`
    status (regression test for the accounting bug).

## Expected outcome

- Backlog (329 unscored) clears within one raised-cap sweep or two $2 runs,
  vs. impossible today.
- ~60% lower spend per equivalent scored set (dedup removes 28%; triage removes
  Sonnet cost on confident NO_GO; trimming cuts input tokens on the dominant
  tier).
- No change to score output schema, existing scores, or the UI.
- Every run leaves `cron_runs` with accurate cost and a terminal status.
