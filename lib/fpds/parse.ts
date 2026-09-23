// Pure parser + summary for the FPDS-NG public ATOM feed
// (https://www.fpds.gov/ezsearch/FEEDS/ATOM?FEEDNAME=PUBLIC&q=...). I/O lives in
// scripts/price-anchor.ts. Kept dependency-free so it is unit-testable.

export interface FpdsAward {
  piid: string;
  title: string;
  isNewAward: boolean; // title starts with "New " — everything else is a modification
  signed: string | null; // YYYY-MM-DD
  obligated: number;
  total: number; // baseAndAllOptionsValue
  vendor: string;
  description: string;
  competed: string | null;
  setAside: string | null;
  offers: number | null;
  office: string | null;
  agency: string | null; // contractingOfficeAgencyID description
  naics: string | null;
}

function tag(block: string, name: string): string | null {
  const m = new RegExp(`<ns1:${name}(?:\\s[^>]*)?>([^<]*)<`).exec(block);
  return m ? (m[1] ?? '').trim() : null;
}
/** Attribute text on a tag: FPDS uses description="…" on code fields and name="…" on org ids. */
function tagDesc(block: string, name: string): string | null {
  const m = new RegExp(`<ns1:${name}\\s[^>]*?(?:description|name)="([^"]*)"`).exec(block);
  return m ? (m[1] ?? '').trim() : null;
}
function num(v: string | null): number {
  const n = Number(v ?? '');
  return Number.isFinite(n) ? n : 0;
}
function unescape(s: string): string {
  return s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

export function parseFpdsEntries(xml: string): FpdsAward[] {
  const out: FpdsAward[] = [];
  const re = /<entry>([\s\S]*?)<\/entry>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    const e = m[1] ?? '';
    const t = /<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/.exec(e);
    const title = (t?.[1] ?? '').trim();
    const signedRaw = tag(e, 'signedDate');
    out.push({
      piid: tag(e, 'PIID') ?? '',
      title,
      isNewAward: /^New\b/i.test(title),
      signed: signedRaw ? signedRaw.slice(0, 10) : null,
      obligated: num(tag(e, 'obligatedAmount')),
      total: num(tag(e, 'baseAndAllOptionsValue')),
      vendor: tag(e, 'vendorName') ?? '',
      description: unescape(tag(e, 'descriptionOfContractRequirement') ?? '').replace(/\s+/g, ' ').trim(),
      competed: tagDesc(e, 'extentCompeted'),
      setAside: tagDesc(e, 'typeOfSetAside'),
      offers: tag(e, 'numberOfOffersReceived') != null ? num(tag(e, 'numberOfOffersReceived')) : null,
      office: tag(e, 'contractingOfficeName') ?? tagDesc(e, 'contractingOfficeID') ?? null,
      agency: tagDesc(e, 'contractingOfficeAgencyID'),
      naics: tag(e, 'principalNAICSCode'),
    });
  }
  return out;
}

export interface AwardSummary {
  newAwards: number;
  mods: number;
  p25: number;
  p50: number;
  p75: number;
  max: number;
  underSatShare: number; // share of new awards with total ≤ $350k
  medianOffers: number | null;
  setAsides: Record<string, number>;
}

function pct(sorted: number[], p: number): number {
  if (!sorted.length) return 0;
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  const a = sorted[lo] ?? 0;
  const b = sorted[hi] ?? a;
  return a + (b - a) * (idx - lo);
}

export function summarizeAwards(rows: FpdsAward[], satUsd = 350_000): AwardSummary {
  const fresh = rows.filter((r) => r.isNewAward);
  const vals = fresh.map((r) => r.total || r.obligated).sort((a, b) => a - b);
  const offers = fresh.map((r) => r.offers).filter((o): o is number => o != null).sort((a, b) => a - b);
  const setAsides: Record<string, number> = {};
  for (const r of fresh) {
    const k = r.setAside ?? '(unknown)';
    setAsides[k] = (setAsides[k] ?? 0) + 1;
  }
  return {
    newAwards: fresh.length,
    mods: rows.length - fresh.length,
    p25: pct(vals, 0.25),
    p50: pct(vals, 0.5),
    p75: pct(vals, 0.75),
    max: vals[vals.length - 1] ?? 0,
    underSatShare: vals.length ? vals.filter((v) => v <= satUsd).length / vals.length : 0,
    medianOffers: offers.length ? pct(offers, 0.5) : null,
    setAsides,
  };
}
