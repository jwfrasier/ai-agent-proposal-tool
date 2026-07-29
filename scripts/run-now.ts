/**
 * Manual full pipeline run — fetch new SAM opps, dedup, triage, and Sonnet-score
 * the survivors, governed by the cost cap.
 *   npm run run-now [costCapUsd] [topN]
 *
 * This is the real run: it spends Sonnet on triage-advance opportunities. Use
 * `npm run dry-run` first to project the cost. Defaults: cap = DAILY_COST_CAP_USD,
 * topN = 50 (higher than the daily cron's 10 so a manual backlog sweep isn't
 * throttled; the cost cap still bounds total spend).
 *
 * Side effects: calls SAM.gov + Anthropic (Haiku + Sonnet), writes score rows.
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
const topNArg = process.argv[3];
const topN = topNArg ? Number(topNArg) : 50;

(async () => {
  console.log(`\nFull run — cap $${costCapUsd.toFixed(2)}, topN ${topN}.\n`);
  const s = await runDaily({ db, costCapUsd, topN });

  const fmt = (n: number) => `$${n.toFixed(4)}`;
  console.log('─'.repeat(60));
  console.log(`  status                 ${s.status}`);
  console.log(`  opps fetched (SAM)     ${s.oppsFetched}`);
  console.log(`  opps new               ${s.oppsNew}`);
  console.log(`  rows written           ${s.oppsScored}   (Sonnet scores + dedup/triage/screen markers)`);
  console.log(`  triage → advance       ${s.triageAdvanced}`);
  console.log(`  total spend            ${fmt(s.totalCostUsd)}   (Haiku triage + Sonnet)`);
  console.log('─'.repeat(60));
  console.log(`  cron run id: ${s.cronRunId}${s.errorSummary ? `\n  error: ${s.errorSummary}` : ''}\n`);
  process.exit(0);
})().catch((err) => {
  console.error('run failed:', err);
  process.exit(1);
});
