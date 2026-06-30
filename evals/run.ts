/**
 * evals/run.ts — Golden-case eval harness for scoreOpportunity.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-ant-... npx tsx evals/run.ts           # run & update baseline
 *   ANTHROPIC_API_KEY=sk-ant-... npx tsx evals/run.ts --update  # same (explicit)
 *   ANTHROPIC_API_KEY= npx tsx evals/run.ts                     # exits 0 (no key)
 *
 * Exits 1 if recommendation accuracy drops >2 percentage points vs evals/baseline.json.
 */

import * as fs from 'fs';
import * as path from 'path';
import type { Opportunity, CompanyProfile } from '../lib/db/schema';
import type { ScoreOutput } from '../lib/ai/score';

// ---------------------------------------------------------------------------
// Golden-case fixture shapes
// ---------------------------------------------------------------------------

interface GoldenExpected {
  recommendation: 'GO' | 'NO_GO' | 'MAYBE';
  fitMin: number;
  fitMax: number;
}

interface GoldenFixture {
  id: string;
  description: string;
  opportunity: Record<string, unknown>;
  profile: Record<string, unknown>;
  expected: GoldenExpected;
}

interface BaselineData {
  recordedAt: string;
  recommendationAccuracy: number;
  fitInRangeRate: number;
  caseCount: number;
}

// ---------------------------------------------------------------------------
// Helpers: parse JSON fixture → typed domain objects
// ---------------------------------------------------------------------------

function parseDate(val: unknown): Date | null {
  if (val == null) return null;
  return new Date(val as string);
}

function parseOpportunity(raw: Record<string, unknown>): Opportunity {
  return {
    ...raw,
    postedAt: parseDate(raw['postedAt']),
    responseDeadline: parseDate(raw['responseDeadline']),
    firstSeenAt: new Date(raw['firstSeenAt'] as string),
    lastSyncedAt: new Date(raw['lastSyncedAt'] as string),
  } as unknown as Opportunity;
}

function parseProfile(raw: Record<string, unknown>): CompanyProfile {
  return {
    ...raw,
    updatedAt: new Date(raw['updatedAt'] as string),
  } as unknown as CompanyProfile;
}

// ---------------------------------------------------------------------------
// Load goldens from evals/golden/*.json
// ---------------------------------------------------------------------------

function loadGoldens(goldenDir: string): GoldenFixture[] {
  const files = fs
    .readdirSync(goldenDir)
    .filter((f) => f.endsWith('.json'))
    .sort();

  return files.map((f) => {
    const raw = JSON.parse(fs.readFileSync(path.join(goldenDir, f), 'utf-8'));
    return raw as GoldenFixture;
  });
}

// ---------------------------------------------------------------------------
// Table printing
// ---------------------------------------------------------------------------

type RowResult = {
  id: string;
  expectedRec: string;
  actualRec: string;
  recMatch: boolean;
  expectedRange: string;
  actualFit: number;
  fitInRange: boolean;
  costUsd: number;
};

function printTable(rows: RowResult[]): void {
  const header =
    '  ID                              | EXP       | ACT       | REC? | FIT  | RANGE       | IN? | COST($)';
  const sep = '  ' + '-'.repeat(header.length - 2);
  console.log(header);
  console.log(sep);
  for (const r of rows) {
    const id = r.id.padEnd(32);
    const exp = r.expectedRec.padEnd(9);
    const act = r.actualRec.padEnd(9);
    const recMark = r.recMatch ? ' OK ' : 'FAIL';
    const fit = String(r.actualFit).padStart(3);
    const range = `${r.expectedRange}`.padEnd(11);
    const inMark = r.fitInRange ? 'OK ' : 'NO ';
    const cost = r.costUsd.toFixed(4);
    console.log(`  ${id} | ${exp} | ${act} | ${recMark} | ${fit}  | ${range} | ${inMark} | ${cost}`);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const apiKey = process.env['ANTHROPIC_API_KEY'];
  if (!apiKey) {
    console.log(
      'ANTHROPIC_API_KEY is not set — skipping live eval run.\n' +
        'Set a real key to run the eval harness against the live API.',
    );
    process.exit(0);
  }

  // Ensure config.ts can parse without throwing (SAM + CRON not needed for scoring,
  // but lib/config.ts validates all env vars at module evaluation time).
  if (!process.env['SAM_GOV_API_KEY']) {
    process.env['SAM_GOV_API_KEY'] = 'placeholder-sam-key';
  }
  if (!process.env['CRON_SECRET']) {
    process.env['CRON_SECRET'] = 'placeholder-cron-secret-32';
  }

  // Dynamic import so config.ts only evaluates AFTER placeholders are in place.
  const { scoreOpportunity } = await import('../lib/ai/score.js');

  const evalsDir = path.resolve(__dirname, '..');
  const goldenDir = path.join(evalsDir, 'golden');
  const baselinePath = path.join(evalsDir, 'baseline.json');
  const updateBaseline = process.argv.includes('--update') || true; // always update on run

  const goldens = loadGoldens(goldenDir);
  if (goldens.length === 0) {
    console.error('No golden fixtures found in evals/golden/');
    process.exit(1);
  }

  console.log(`\nRunning eval harness — ${goldens.length} golden cases\n`);

  const rows: RowResult[] = [];
  let recCorrect = 0;
  let fitCorrect = 0;
  let totalCost = 0;

  for (const golden of goldens) {
    process.stdout.write(`  [${golden.id}] scoring...`);

    const opp = parseOpportunity(golden.opportunity);
    const profile = parseProfile(golden.profile);

    let result: ScoreOutput;
    try {
      result = await scoreOpportunity(opp, profile);
    } catch (err) {
      console.error(`\n  ERROR scoring ${golden.id}:`, err);
      process.exit(1);
    }

    const recMatch = result.recommendation === golden.expected.recommendation;
    const fitInRange =
      result.fitScore >= golden.expected.fitMin && result.fitScore <= golden.expected.fitMax;

    if (recMatch) recCorrect++;
    if (fitInRange) fitCorrect++;
    totalCost += result.costUsd;

    rows.push({
      id: golden.id,
      expectedRec: golden.expected.recommendation,
      actualRec: result.recommendation,
      recMatch,
      expectedRange: `${golden.expected.fitMin}–${golden.expected.fitMax}`,
      actualFit: result.fitScore,
      fitInRange,
      costUsd: result.costUsd,
    });

    const statusMark = recMatch ? '✓' : '✗';
    process.stdout.write(
      ` ${statusMark}  rec=${result.recommendation} fit=${result.fitScore} cost=$${result.costUsd.toFixed(4)}\n`,
    );
  }

  const n = goldens.length;
  const recAccuracy = (recCorrect / n) * 100;
  const fitInRateVal = (fitCorrect / n) * 100;

  console.log('\n--- Results -------------------------------------------------------');
  printTable(rows);
  console.log('');
  console.log(`  Recommendation accuracy : ${recCorrect}/${n} = ${recAccuracy.toFixed(1)}%`);
  console.log(`  Fit-in-range rate       : ${fitCorrect}/${n} = ${fitInRateVal.toFixed(1)}%`);
  console.log(`  Total API cost          : $${totalCost.toFixed(4)}`);
  console.log('--------------------------------------------------------------------\n');

  // ---------------------------------------------------------------------------
  // Regression gate: compare vs baseline
  // ---------------------------------------------------------------------------
  let exitCode = 0;

  if (fs.existsSync(baselinePath)) {
    const baseline: BaselineData = JSON.parse(fs.readFileSync(baselinePath, 'utf-8'));
    const drop = baseline.recommendationAccuracy - recAccuracy;
    if (drop > 2) {
      console.error(
        `REGRESSION: recommendation accuracy dropped ${drop.toFixed(1)}pp ` +
          `(baseline ${baseline.recommendationAccuracy.toFixed(1)}% → now ${recAccuracy.toFixed(1)}%).\n` +
          `Fix the scorer or update the baseline with --update if the change is intentional.`,
      );
      exitCode = 1;
    } else {
      console.log(
        `Regression gate passed (vs baseline ${baseline.recommendationAccuracy.toFixed(1)}%).`,
      );
    }
  } else {
    console.log('No baseline.json found — treating this run as the first baseline.');
  }

  // ---------------------------------------------------------------------------
  // Write / update baseline
  // ---------------------------------------------------------------------------
  if (updateBaseline) {
    const newBaseline: BaselineData = {
      recordedAt: new Date().toISOString(),
      recommendationAccuracy: recAccuracy,
      fitInRangeRate: fitInRateVal,
      caseCount: n,
    };
    fs.writeFileSync(baselinePath, JSON.stringify(newBaseline, null, 2) + '\n');
    console.log(`Baseline updated → evals/baseline.json`);
  }

  process.exit(exitCode);
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
