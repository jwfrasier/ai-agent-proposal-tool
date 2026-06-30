/**
 * Opportunity inspector — triage a notice with the same lens the pipeline uses.
 *   npm run inspect <noticeId | search text>
 * Read-only; needs no API keys (opens SQLite directly and runs the deterministic screen).
 */
import Database from 'better-sqlite3';
import { screenOpportunity } from '../lib/screening/screen';

const arg = process.argv.slice(2).join(' ').trim();
if (!arg) {
  console.error('usage: npm run inspect <noticeId | search text>');
  process.exit(1);
}

const db = new Database(process.env.DATABASE_URL || './data/govcontracts.db', { readonly: true });
const rows = db
  .prepare('SELECT * FROM opportunities WHERE notice_id = ? OR title LIKE ? ORDER BY first_seen_at DESC LIMIT 10')
  .all(arg, `%${arg}%`) as Record<string, unknown>[];

if (rows.length === 0) {
  console.log(`No opportunities match "${arg}".`);
  process.exit(0);
}

const DISPO_LABEL: Record<string, string> = { auto_pass: 'AUTO-PASS', flag: 'FLAG', clear: 'CLEAR' };

for (const o of rows) {
  const raw = JSON.parse((o.raw_json as string) ?? '{}');
  const screen = screenOpportunity({
    noticeType: raw.type,
    title: o.title as string,
    description: o.description as string | null,
    setAside: o.set_aside as string | null,
  });
  const score = db
    .prepare('SELECT fit_score, recommendation, confidence, ambiguity, confidence_reason, model FROM scores WHERE opportunity_id = ? ORDER BY created_at DESC LIMIT 1')
    .get(o.notice_id) as Record<string, unknown> | undefined;
  const deadline = o.response_deadline ? new Date(o.response_deadline as number).toISOString().slice(0, 10) : 'n/a';

  console.log('\n' + '─'.repeat(78));
  console.log(`${o.title}`);
  console.log(`  notice ${o.notice_id}  |  type: ${raw.type ?? '?'}  |  NAICS ${o.naics ?? '?'}`);
  console.log(`  agency: ${o.agency}  |  set-aside: ${o.set_aside || 'unrestricted'}  |  deadline: ${deadline}`);
  if (raw.uiLink) console.log(`  link: ${raw.uiLink}`);
  console.log(`  SCREEN: ${DISPO_LABEL[screen.disposition]}${screen.category ? ` (${screen.category})` : ''} — ${screen.reason}`);
  for (const s of screen.signals) console.log(`    • [${s.category}] ${s.rule}: "${s.matched}"`);
  if (score) {
    const m = String(score.model).startsWith('screen:') ? ' [screened, no AI]' : '';
    console.log(`  SCORE: ${score.fit_score} ${score.recommendation}  conf=${score.confidence ?? 'n/a'} (${score.ambiguity ?? 'n/a'})${m}`);
    if (score.confidence_reason) console.log(`    reason: ${score.confidence_reason}`);
  } else {
    console.log('  SCORE: (not yet scored)');
  }
}
console.log('');
