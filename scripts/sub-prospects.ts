/**
 * Subcontract prospects — small primes that just won software/AI work in our NAICS and
 * have room for an AI/data sub. Built from the keyless FPDS ATOM feed.
 *
 *   npm run sub-prospects                          # last 120 days, our NAICS, SB/8(a)/SDVOSB/HUBZone/WOSB primes
 *   npm run sub-prospects -- --days 60 --naics 541511,541512 --min 250000 --max-value 15000000 --top 40
 *   npm run sub-prospects -- --out docs/subcontracting/PROSPECTS-2026-09-23.md
 *
 * Why: every scorer output flags "no federal past performance". A sub role on a small
 * prime's fresh award is the fastest citable federal reference, and Frasier's SDB status
 * counts toward the prime's own small-disadvantaged subcontracting goals — that is the pitch.
 */
import { writeFileSync } from 'node:fs';
import { parseFpdsEntries, type FpdsAward } from '../lib/fpds/parse';

const UA = { 'User-Agent': 'Mozilla/5.0 (govcontracts-dashboard sub-prospects)' };
// What a sub with our skills can actually take a slice of. Hardware/licence buys are excluded.
const FIT = /\b(AI|ARTIFICIAL INTELLIGENCE|MACHINE LEARNING|LLM|GENERATIVE|DATA (SCIENCE|ENGINEER|ANALYTIC|PLATFORM|SERVICES|MANAGEMENT|WAREHOUSE)|ANALYTICS?|SOFTWARE (DEVELOP|ENGINEER|MAINTENANCE|MODERN)|APPLICATION (DEVELOP|MODERN|MAINTENANCE|SUPPORT|PROJECT)|WEB (SERVICES|DEVELOP|APPLICATION|SITE|PORTAL)|WEBSITE|PORTAL|MODERNI[SZ]ATION|CLOUD (MIGRATION|SUPPORT|SERVICES|ENGINEER)|MIGRATION|DEVELOPMENT|DEVOPS|DASHBOARD|AUTOMATION|LOW.?CODE|SALESFORCE|SERVICENOW|SHAREPOINT|DRUPAL|API)\w*/gi;
const NOFIT = /\b(EQUIPMENT|HARDWARE|TAPE|PURCHASE OF|LICENSES?|SUBSCRIPTION|RENEWAL|REFRESH|AUDIOVISUAL|AV SYSTEMS|LAPTOP|SERVER|SWITCHES|PRINTER|CABLING|TELEPHON|VOIP|HELP ?DESK|SERVICE DESK|STAFFING)\b/i;
const SETASIDES: Record<string, string> = { SBA: 'SB total', '8A': '8(a) competed', '8AN': '8(a) sole source', SDVOSBC: 'SDVOSB', HZC: 'HUBZone', WOSB: 'WOSB', EDWOSB: 'EDWOSB' };

function arg(name: string, def?: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : def;
}
const ymd = (d: Date) => `${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${String(d.getUTCDate()).padStart(2, '0')}`;
const usd = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;

async function fetchAll(q: string, maxPages: number): Promise<FpdsAward[]> {
  const rows: FpdsAward[] = [];
  for (let page = 0; page < maxPages; page++) {
    const url = `https://www.fpds.gov/ezsearch/FEEDS/ATOM?FEEDNAME=PUBLIC&q=${encodeURIComponent(q)}&start=${page * 10}`;
    const resp = await fetch(url, { headers: UA });
    if (!resp.ok) throw new Error(`FPDS ${resp.status}`);
    const xml = await resp.text();
    const batch = parseFpdsEntries(xml);
    rows.push(...batch);
    if (batch.length < 10 || !/rel="next"/.test(xml)) break;
  }
  return rows;
}

interface Prospect {
  vendor: string;
  awards: FpdsAward[];
  value: number;
  fitHits: number;
  agencies: Set<string>;
  setAsides: Set<string>;
}

(async () => {
  const days = Number(arg('days', '120'));
  const naics = (arg('naics', '541511,541512,541519') ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  const codes = (arg('setasides', 'SBA,8A,8AN,SDVOSBC,HZC,WOSB') ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  const min = Number(arg('min', '250000'));
  const maxValue = Number(arg('max-value', '15000000'));
  const top = Number(arg('top', '30'));
  const maxPages = Number(arg('pages', '12'));
  const out = arg('out');
  const from = ymd(new Date(Date.now() - days * 86400_000));
  const to = ymd(new Date());

  const seen = new Set<string>();
  const rows: FpdsAward[] = [];
  let queries = 0;
  for (const n of naics) {
    for (const c of codes) {
      queries++;
      const q = `PRINCIPAL_NAICS_CODE:"${n}" TYPE_OF_SET_ASIDE:"${c}" SIGNED_DATE:[${from},${to}]`;
      for (const r of await fetchAll(q, maxPages)) {
        const key = `${r.piid}|${r.title}`;
        if (!seen.has(key)) { seen.add(key); rows.push(r); }
      }
      process.stderr.write(`  ${n} ${c.padEnd(8)} → ${rows.length} actions so far\n`);
    }
  }

  const fresh = rows.filter((r) => r.isNewAward && (r.total || r.obligated) >= min && (r.total || r.obligated) <= maxValue);
  const byVendor = new Map<string, Prospect>();
  for (const r of fresh) {
    const hits = NOFIT.test(r.description) ? 0 : (r.description.match(FIT) ?? []).length;
    const p = byVendor.get(r.vendor) ?? { vendor: r.vendor, awards: [], value: 0, fitHits: 0, agencies: new Set(), setAsides: new Set() };
    p.awards.push(r);
    p.value += r.total || r.obligated;
    p.fitHits += hits;
    if (r.agency ?? r.office) p.agencies.add((r.agency ?? r.office)!);
    if (r.setAside) p.setAsides.add(r.setAside);
    byVendor.set(r.vendor, p);
  }
  const ranked = [...byVendor.values()]
    .filter((p) => p.fitHits > 0)
    .sort((a, b) => b.fitHits * Math.log10(b.value + 1) - a.fitHits * Math.log10(a.value + 1))
    .slice(0, top);

  const lines: string[] = [];
  lines.push(`# Subcontract prospects — ${to.replace(/\//g, '-')}`);
  lines.push('');
  lines.push(`Source: FPDS new awards signed ${from}–${to}, NAICS ${naics.join('/')}, set-asides ${codes.map((c) => SETASIDES[c] ?? c).join(', ')}, value ${usd(min)}–${usd(maxValue)}. ${queries} queries, ${rows.length} actions, ${fresh.length} qualifying new awards, ${byVendor.size} primes, ${ranked.length} with software/AI-shaped scope.`);
  lines.push('');
  lines.push('Pitch: Frasier Digital is an SDB — a sub award to us counts toward the prime\'s small-disadvantaged subcontracting goal, and we bring AI/LLM delivery most small primes do not have in-house. Find the prime\'s BD contact via `https://sam.gov/search/?keywords=<vendor>` (entity record lists the government business POC) or the company site; send `OUTREACH-TEMPLATE.md`.');
  lines.push('');
  lines.push('| # | Prime | Awards | Total value | Set-aside | Buying office(s) | Recent award (what they now have to deliver) |');
  lines.push('|---|---|---|---|---|---|---|');
  ranked.forEach((p, i) => {
    const a = [...p.awards].sort((x, y) => (y.total || y.obligated) - (x.total || x.obligated))[0]!;
    lines.push(`| ${i + 1} | **${p.vendor}** | ${p.awards.length} | ${usd(p.value)} | ${[...p.setAsides].map((s) => s.replace(' SET ASIDE - TOTAL', '')).join('; ').slice(0, 40)} | ${[...p.agencies].slice(0, 2).join('; ').slice(0, 50)} | ${a.signed} ${usd(a.total || a.obligated)} \`${a.piid}\` — ${a.description.slice(0, 140)} |`);
  });
  lines.push('');
  lines.push('## Working list');
  lines.push('');
  lines.push('| Prime | Contact found | Sent | Reply | Status |');
  lines.push('|---|---|---|---|---|');
  ranked.slice(0, 10).forEach((p) => lines.push(`| ${p.vendor} | | | | |`));
  lines.push('');
  const md = lines.join('\n');
  if (out) { writeFileSync(out, md); console.log(`wrote ${out} (${ranked.length} prospects)`); }
  else console.log(md);
})();
