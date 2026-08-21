/**
 * Roster consistency checker — cross-checks docs/people/ (source of truth for
 * everyone Frasier may name in a proposal) against every markdown bid document
 * under docs/responses/.
 *   npm run roster-check            report-only, always exits 0
 *   npm run roster-check -- --strict  exits 1 if any rate mismatch is found
 *
 * Why it exists: real drift has happened — rates cited inconsistently,
 * reference POCs nearly staffed onto bid teams (the Ethan Gula rule),
 * UNVERIFIED facts almost shipping. This reports, per person:
 *   1. reference-POC / do-not-use people named in response docs (VERIFY —
 *      appearing as the PPQ/reference contact is legitimate; check context)
 *   2. $NN/hr figures on lines naming the person that are not in their card
 *   3. people with UNVERIFIED card facts who appear in any response doc
 *
 * All parsing/matching logic is pure and lives in lib/roster/check.ts; this
 * script only owns file discovery, reading, and printing.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import {
  assembleFindings,
  parsePersonCard,
  type PersonCard,
  type ResponseDoc,
} from '../lib/roster/check';

const ROOT = join(__dirname, '..');
const PEOPLE_DIR = join(ROOT, 'docs', 'people');
const RESPONSES_DIR = join(ROOT, 'docs', 'responses');
const SKIP_CARDS = new Set(['roster.md', 'README.md']);

function loadCards(): PersonCard[] {
  return readdirSync(PEOPLE_DIR)
    .filter((f) => f.endsWith('.md') && !SKIP_CARDS.has(f))
    .filter((f) => statSync(join(PEOPLE_DIR, f)).isFile())
    .map((f) => parsePersonCard(f, readFileSync(join(PEOPLE_DIR, f), 'utf8')));
}

function collectResponseDocs(dir: string, out: ResponseDoc[] = []): ResponseDoc[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules') continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) collectResponseDocs(full, out);
    else if (entry.isFile() && entry.name.endsWith('.md')) {
      out.push({ path: relative(ROOT, full), content: readFileSync(full, 'utf8') });
    }
  }
  return out;
}

const strict = process.argv.includes('--strict');
const cards = loadCards();
const docs = collectResponseDocs(RESPONSES_DIR);
const report = assembleFindings(cards, docs);

console.log(
  `\nRoster consistency check — ${cards.length} cards vs ${docs.length} response docs\n${'─'.repeat(72)}`
);

for (const person of report.people) {
  console.log(`\n${person.name}${person.status ? `  [${person.status}]` : ''}`);

  if (person.statusFlags.length > 0) {
    console.log(
      `  🚨 VERIFY: ${person.status} must not be on a bid team (appearing as the` +
        ` PPQ/reference contact is legitimate — check context). ${person.statusFlags.length} mention(s):`
    );
    for (const m of person.statusFlags) {
      console.log(`     ${m.file}:${m.line}`);
      console.log(`       ${m.text}`);
    }
  }

  for (const m of person.rateMismatches) {
    console.log(
      `  💲 RATE MISMATCH: doc says ${m.docRates.join(', ')} — card says ${
        m.cardRates.length ? m.cardRates.join(', ') : '(no rate on card)'
      }`
    );
    console.log(`     ${m.file}:${m.line}`);
    console.log(`       ${m.text}`);
  }

  if (person.unverifiedReminder) {
    const r = person.unverifiedReminder;
    console.log(
      `  ⚠️  UNVERIFIED facts on card, and person appears in ${r.files.length} response doc(s)` +
        ` (${r.mentionCount} mention(s)) — confirm before shipping:`
    );
    for (const l of r.unverifiedLines) console.log(`     card line ${l.line}: ${l.text}`);
    for (const f of r.files) console.log(`     appears in: ${f}`);
  }
}

const { counts } = report;
const total = counts.statusFlags + counts.rateMismatches + counts.unverifiedReminders;
console.log(`\n${'─'.repeat(72)}`);
console.log(
  total === 0
    ? 'No findings — cards and response docs are consistent.'
    : `${total} finding(s): ${counts.statusFlags} status flag(s), ` +
        `${counts.rateMismatches} rate mismatch(es), ${counts.unverifiedReminders} UNVERIFIED reminder(s).`
);

if (strict && counts.rateMismatches > 0) {
  console.log('--strict: exiting 1 due to rate mismatches.\n');
  process.exit(1);
}
console.log('');
process.exit(0);
