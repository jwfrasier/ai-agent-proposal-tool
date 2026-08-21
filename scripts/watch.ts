/**
 * Notice watch monitor — catches what the daily fetch pipeline can't: changes
 * to notices we are actively bidding (amendments, Q&A postings, cancellations,
 * deadline moves, new attachments).
 *   npm run watch
 *
 * Why it exists: the DoWEA RFP sat archived+cancelled on SAM for 4 days
 * (8/17→8/21) and the CDC AI-plan template for 2 before anyone noticed —
 * both were "watch SAM" memory items with no automation behind them.
 *
 * Uses SAM's public UI endpoints (no API key): follows the revision chain via
 * the search index (amendments publish as NEW notice ids), diffs against
 * data/watch-state.json, and prints deadline countdowns for every watched bid.
 * Run it at the start of any bid session and before any scheduled send.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { countdown, diffSnapshots, type NoticeSnapshot } from '../lib/watch/diff';

const WATCHLIST_PATH = 'watchlist.json';
const STATE_PATH = 'data/watch-state.json';
const UA = { 'User-Agent': 'Mozilla/5.0 (govcontracts-dashboard watch)' };

interface WatchEntry {
  noticeId: string; // last-known latest revision id
  label: string;
  deadlineOverride?: string; // used when SAM's field is absent (e.g. RFI dates)
  notes?: string;
}

async function fetchJson(url: string): Promise<any> {
  const resp = await fetch(url, { headers: UA });
  if (!resp.ok) throw new Error(`${resp.status} ${url}`);
  return resp.json();
}

/** Resolve the CURRENT latest revision id for a notice (amendments create new ids). */
async function resolveLatest(noticeId: string): Promise<any> {
  let record = await fetchJson(`https://sam.gov/api/prod/opps/v2/opportunities/${noticeId}`);
  if (record.latest === true) return record;
  const solnum = record?.data2?.solicitationNumber;
  if (solnum) {
    const search = await fetchJson(
      `https://sam.gov/api/prod/sgs/v1/search/?index=opp&q=${encodeURIComponent(solnum)}&page=0&size=5&mode=search&sort=-modifiedDate`
    );
    const results = search?._embedded?.results ?? [];
    const hit = results.find((r: any) => r._id && r._id !== noticeId);
    if (hit) {
      record = await fetchJson(`https://sam.gov/api/prod/opps/v2/opportunities/${hit._id}`);
    }
  }
  return record;
}

async function fetchAttachments(noticeId: string): Promise<string[]> {
  try {
    const d = await fetchJson(
      `https://sam.gov/api/prod/opps/v3/opportunities/${noticeId}/resources`
    );
    const lists = d?._embedded?.opportunityAttachmentList ?? [];
    const names: string[] = [];
    for (const l of lists) for (const f of l.attachments ?? []) if (f.name) names.push(f.name);
    return names.sort();
  } catch {
    return []; // resources endpoint 404s on some notice types; not fatal
  }
}

async function snapshot(entry: WatchEntry): Promise<NoticeSnapshot> {
  const record = await resolveLatest(entry.noticeId);
  const d2 = record?.data2 ?? {};
  const id = record?.opportunityId ?? record?.id ?? entry.noticeId;
  return {
    noticeId: id,
    title: d2.title ?? '(unknown)',
    solicitationNumber: d2.solicitationNumber ?? null,
    archived: record?.archived === true,
    cancelled: record?.cancelled === true,
    modifiedDate: record?.modifiedDate ?? null,
    responseDeadline: d2?.solicitation?.deadlines?.response ?? entry.deadlineOverride ?? null,
    attachments: await fetchAttachments(id),
  };
}

(async () => {
  if (!existsSync(WATCHLIST_PATH)) {
    console.error(`No ${WATCHLIST_PATH} found. Create it: [{"noticeId":"…","label":"…"}]`);
    process.exit(1);
  }
  const watchlist: WatchEntry[] = JSON.parse(readFileSync(WATCHLIST_PATH, 'utf8'));
  const state: Record<string, NoticeSnapshot> = existsSync(STATE_PATH)
    ? JSON.parse(readFileSync(STATE_PATH, 'utf8'))
    : {};

  const now = new Date();
  let alarms = 0;
  console.log(`\nNotice watch — ${now.toISOString()}\n${'─'.repeat(72)}`);

  for (const entry of watchlist) {
    let curr: NoticeSnapshot;
    try {
      curr = await snapshot(entry);
    } catch (e) {
      alarms++;
      console.log(`\n⚠️  ${entry.label}: FETCH FAILED (${e instanceof Error ? e.message : e})`);
      continue;
    }
    const prev = state[entry.label];
    const changes = diffSnapshots(prev, curr);
    const cd = countdown(curr.responseDeadline, now);
    const flags = [
      curr.cancelled ? 'CANCELLED' : null,
      curr.archived ? 'archived' : null,
    ]
      .filter(Boolean)
      .join(',');

    const cdText = cd
      ? `${cd.label === 'ok' ? '' : `[${cd.label}] `}due ${cd.text}`
      : 'no deadline on record';
    console.log(
      `\n${changes.length ? '🔔' : '  '} ${entry.label}${flags ? `  ⚑ ${flags}` : ''}`
    );
    console.log(`   ${curr.solicitationNumber ?? ''} · ${cdText}${entry.notes ? ` · ${entry.notes}` : ''}`);
    for (const c of changes) {
      if (c.severity === 'alarm') alarms++;
      console.log(`   ${c.severity === 'alarm' ? '🚨' : '·'} ${c.message}`);
    }
    if (!prev) console.log('   (first sighting — state seeded)');
    state[entry.label] = curr;
    // keep the watchlist's notice id current so the chain doesn't grow stale
    entry.noticeId = curr.noticeId;
  }

  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
  writeFileSync(WATCHLIST_PATH, JSON.stringify(watchlist, null, 2));
  console.log(`\n${'─'.repeat(72)}\n${alarms ? `${alarms} ALARM(S) above` : 'No changes.'}\n`);
  process.exit(alarms ? 2 : 0);
})();
