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
