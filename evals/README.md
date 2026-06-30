# Eval Harness — AI Scoring Quality

Golden-case regression tests for `scoreOpportunity` in `lib/ai/score.ts`.

## Quick start

Add the script to `package.json` (the orchestrator handles this, or add manually):

```json
"evals": "tsx evals/run.ts"
```

Then run with a real Anthropic API key:

```bash
ANTHROPIC_API_KEY=sk-ant-... npm run evals
```

Or invoke tsx directly:

```bash
ANTHROPIC_API_KEY=sk-ant-... npx tsx evals/run.ts
```

Running without a key exits 0 and prints a skip message — CI without a key will not fail.

## What it does

1. Loads all `evals/golden/*.json` fixture files (alphabetical order).
2. Calls `scoreOpportunity(opp, profile)` live against the Anthropic API for each case.
3. Compares `recommendation` and `fitScore` against the `expected` block in each fixture.
4. Prints a per-case results table.
5. Reports two aggregate metrics:
   - **Recommendation accuracy** — % of cases where `recommendation` exactly matches expected.
   - **Fit-in-range rate** — % of cases where `fitScore` falls within `[fitMin, fitMax]`.
6. Compares recommendation accuracy against `evals/baseline.json`.
   - If the current run drops **more than 2 percentage points** below the baseline, the process exits 1 (regression failure).
7. Writes/overwrites `evals/baseline.json` with the current run's metrics.

## Regression gating

`evals/baseline.json` tracks the last accepted accuracy. The 2pp threshold allows for normal LLM non-determinism without false positives. If you intentionally change the scoring prompt and accept a lower accuracy, run once to update the baseline and commit the new `baseline.json`.

To reset the baseline (treat next run as first-ever):

```bash
rm evals/baseline.json
ANTHROPIC_API_KEY=sk-ant-... npx tsx evals/run.ts
```

## Adding a golden case

1. Copy any existing file in `evals/golden/` as a starting point.
2. Give it a descriptive filename: `go-<topic>.json`, `nogo-<topic>.json`, or `maybe-<topic>.json`.
3. Fill in a realistic `opportunity` object (all fields from the `opportunities` table; dates as ISO-8601 strings).
4. Reuse or adapt the shared `profile` block (Frasier Digital LLC).
5. Set `expected.recommendation` to `GO`, `NO_GO`, or `MAYBE`.
6. Set `expected.fitMin` / `expected.fitMax` (0–100 range) to a band wide enough to absorb reasonable model variance (typically ±15 points around the mode you expect).
7. Run the harness and confirm the new case passes. Then commit both the fixture and the updated `baseline.json`.

### Fixture field reference

| Field | Type | Notes |
|---|---|---|
| `id` | string | Unique slug, used in table output |
| `description` | string | Human explanation of why this case has its expected outcome |
| `opportunity` | object | Matches `Opportunity` from `lib/db/schema.ts` |
| `profile` | object | Matches `CompanyProfile` from `lib/db/schema.ts` |
| `expected.recommendation` | `GO`/`NO_GO`/`MAYBE` | Exact match required |
| `expected.fitMin` | number 0–100 | Inclusive lower bound |
| `expected.fitMax` | number 0–100 | Inclusive upper bound |

## Current golden cases

| File | Expected | Rationale |
|---|---|---|
| `go-web-modernization.json` | GO | GSA website rewrite, 541511, TSB set-aside, $175k |
| `go-rag-chatbot.json` | GO | DOJ AI chatbot (RAG), 541512, SB set-aside, $200k |
| `go-cloud-migration.json` | GO | HHS AWS GovCloud migration, 541513, SDB set-aside, $280k |
| `go-508-accessibility.json` | GO | VA Section 508 audit, 541519, open competition, $95k |
| `nogo-janitorial.json` | NO_GO | Pentagon custodial services, NAICS 561720, no IT overlap |
| `nogo-sdvosb-setaside.json` | NO_GO | VA web work but SDVOSB-only; we hold no SDVOSB cert |
| `nogo-construction.json` | NO_GO | GSA HVAC/building renovation, NAICS 236220, no IT work |
| `maybe-mixed-itconsulting.json` | MAYBE | DHS ERP migration + dashboard; ~60% ERP (out of scope), 40% web |
