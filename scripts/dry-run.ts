/**
 * Triage dry-run — Layers 1-2 only (dedup + cheap Haiku triage), NO Sonnet spend.
 *   npm run dry-run [costCapUsd]
 *
 * Fetches new SAM opportunities, dedups reposted solicitations, and runs the
 * cheap Haiku triage over every opportunity not yet scored at the current
 * profile version. Persists dedup/triage-reject marker rows (so the subsequent
 * real run skips them) and reports the PROJECTED Sonnet cost to score the
 * survivors — so you can pick the cost cap for the real run from real numbers.
 *
 * Side effects: calls SAM.gov + Anthropic (Haiku), writes marker rows to the DB.
 * It does NOT spend Sonnet and does NOT score the "advance" opportunities.
 */
import { db } from '../lib/db/client';
import { config } from '../lib/config';
import { runDaily } from '../lib/pipeline/daily-run';

const capArg = process.argv[2];
const costCapUsd = capArg ? Number(capArg) : config.dailyCostCapUsd;
if (Number.isNaN(costCapUsd) || costCapUsd <= 0) {
  console.error(`Invalid cost cap: "${capArg}"`);
  process.exit(1);
}
// The daily run caps throughput at topN=10; a backlog dry-run must cover the
// whole unscored set to project a meaningful number. Override with a high topN
// (2nd arg to tune). The cost cap still governs total Haiku triage spend.
const topNArg = process.argv[3];
const topN = topNArg ? Number(topNArg) : 10_000;

(async () => {
  console.log(`\nTriage dry-run (triageOnly) — cap $${costCapUsd.toFixed(2)}, topN ${topN}, no Sonnet spend.\n`);
  const s = await runDaily({ db, costCapUsd, triageOnly: true, topN });

  const fmt = (n: number) => `$${n.toFixed(4)}`;
  console.log('─'.repeat(60));
  console.log(`  status                 ${s.status}`);
  console.log(`  opps fetched (SAM)     ${s.oppsFetched}`);
  console.log(`  opps new               ${s.oppsNew}`);
  console.log(`  marker rows written    ${s.oppsScored}   (dedup + triage-reject)`);
  console.log(`  triage → advance       ${s.triageAdvanced}   (would be Sonnet-scored)`);
  console.log(`  triage spend (Haiku)   ${fmt(s.totalCostUsd)}`);
  console.log('─'.repeat(60));
  console.log(`  PROJECTED Sonnet cost  ${fmt(s.projectedSonnetCostUsd)}   to score the ${s.triageAdvanced} survivors`);
  console.log('─'.repeat(60));
  console.log(`\n  → For the real run, choose a cap ≥ ${fmt(s.projectedSonnetCostUsd)} to clear the backlog in one sweep.`);
  console.log(`    cron run id: ${s.cronRunId}${s.errorSummary ? `\n    error: ${s.errorSummary}` : ''}\n`);
  process.exit(0);
})().catch((err) => {
  console.error('dry-run failed:', err);
  process.exit(1);
});
