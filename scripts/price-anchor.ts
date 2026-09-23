/**
 * Price anchor — what did this buying office actually pay for work like ours?
 *   npm run price-anchor -- --agency "NATIONAL OCEANIC AND ATMOSPHERIC ADMINISTRATION" --naics 541511,541512
 *   npm run price-anchor -- --office "NOAA WESTERN ACQUISITION" --naics 541511 --from 2025/10/01
 *   npm run price-anchor -- --q 'VENDOR_FULL_NAME:"VALINOR LABS"'        (raw FPDS query)
 *   flags: --sat (list only new awards ≤ $350k)  --mods (include modifications)  --max N pages/query
 *
 * Why: NOAA COMPASS was lost at $162k to a $28,665 winner. The office's award history
 * would have shown that in ten minutes. Run this BEFORE building any price volume and
 * put the P25/P50/P75 line in the price narrative's internal notes.
 *
 * Uses the keyless FPDS-NG ATOM feed (10 entries/page; we page until --max).
 */
import { parseFpdsEntries, summarizeAwards, type FpdsAward } from '../lib/fpds/parse';

const UA = { 'User-Agent': 'Mozilla/5.0 (govcontracts-dashboard price-anchor)' };

function arg(name: string, def?: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : def;
}
function ymd(d: Date): string {
  return `${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${String(d.getUTCDate()).padStart(2, '0')}`;
}
function usd(n: number): string {
  return `$${Math.round(n).toLocaleString('en-US')}`;
}

async function fetchAll(q: string, maxPages: number): Promise<FpdsAward[]> {
  const rows: FpdsAward[] = [];
  for (let page = 0; page < maxPages; page++) {
    const url = `https://www.fpds.gov/ezsearch/FEEDS/ATOM?FEEDNAME=PUBLIC&q=${encodeURIComponent(q)}&start=${page * 10}`;
    const resp = await fetch(url, { headers: UA });
    if (!resp.ok) throw new Error(`FPDS ${resp.status} ${url}`);
    const xml = await resp.text();
    const batch = parseFpdsEntries(xml);
    rows.push(...batch);
    if (batch.length < 10 || !/rel="next"/.test(xml)) break;
  }
  return rows;
}

(async () => {
  const to = arg('to', ymd(new Date()))!;
  const from = arg('from', ymd(new Date(Date.now() - 365 * 86400_000)))!;
  const naics = (arg('naics') ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  const maxPages = Number(arg('max', '20'));
  const showMods = process.argv.includes('--mods');
  const satOnly = process.argv.includes('--sat'); // list only new awards ≤ $350k — our lane

  let q = arg('q');
  if (!q) {
    const parts: string[] = [];
    if (arg('agency')) parts.push(`CONTRACTING_AGENCY_NAME:"${arg('agency')}"`);
    if (arg('office')) parts.push(`CONTRACTING_OFFICE_NAME:"${arg('office')}"`);
    if (arg('vendor')) parts.push(`VENDOR_FULL_NAME:"${arg('vendor')}"`);
    if (!parts.length) {
      console.error('Need --agency, --office, --vendor or --q. See header comment.');
      process.exit(1);
    }
    parts.push(`SIGNED_DATE:[${from},${to}]`);
    q = parts.join(' ');
  }

  // FPDS accepts one NAICS per query; fan out and merge.
  const queries = naics.length ? naics.map((n) => `${q} PRINCIPAL_NAICS_CODE:"${n}"`) : [q];
  const seen = new Set<string>();
  const rows: FpdsAward[] = [];
  for (const qq of queries) {
    for (const r of await fetchAll(qq, maxPages)) {
      const key = `${r.piid}|${r.title}`;
      if (!seen.has(key)) { seen.add(key); rows.push(r); }
    }
  }

  const fresh = rows.filter((r) => r.isNewAward).sort((a, b) => (b.total || b.obligated) - (a.total || a.obligated));
  const s = summarizeAwards(rows);

  console.log(`\nFPDS price anchor — ${queries.length} query(ies), ${rows.length} actions, ${from}→${to}`);
  console.log('─'.repeat(100));
  console.log(`NEW awards: ${s.newAwards}   mods: ${s.mods}   P25 ${usd(s.p25)}   P50 ${usd(s.p50)}   P75 ${usd(s.p75)}   max ${usd(s.max)}`);
  console.log(`≤ $350k SAT: ${(s.underSatShare * 100).toFixed(0)}% of new awards   median offers received: ${s.medianOffers ?? 'n/a'}`);
  console.log(`set-asides: ${Object.entries(s.setAsides).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ×${v}`).join(' · ')}`);
  console.log('─'.repeat(100));
  const listed = showMods ? rows : satOnly ? fresh.filter((r) => (r.total || r.obligated) <= 350_000) : fresh;
  for (const r of listed) {
    const off = r.offers != null ? `${r.offers} offers` : '';
    console.log(`${(r.signed ?? '').padEnd(10)} ${usd(r.total || r.obligated).padStart(12)}  ${r.vendor.slice(0, 32).padEnd(32)} ${(r.setAside ?? '').slice(0, 22).padEnd(22)} ${off.padEnd(9)} ${r.naics ?? ''}`);
    if (r.description) console.log(`           ${r.description.slice(0, 110)}`);
  }
  console.log();
})();
