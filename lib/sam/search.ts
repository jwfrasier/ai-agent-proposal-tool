import { samSearch } from './client';
import type { SamOpportunityRaw } from './schemas';

export interface SearchByProfileArgs {
  naicsCodes: string[];
  /** Title keywords searched in addition to NAICS. Agencies file custom-software buys
   *  under NAICS we don't list (SSS Moodle LMS RFQ 90MC26Q0006 went out under 513210,
   *  Software Publishers, and the NAICS-only search never fetched it). */
  keywords?: string[];
  postedFrom: string; // YYYY-MM-DD
  postedTo?: string;
  maxAwardCeiling?: number;
  perNaicsLimit?: number;
}

export async function searchByProfile(args: SearchByProfileArgs): Promise<SamOpportunityRaw[]> {
  const { naicsCodes, keywords = [], postedFrom, postedTo, maxAwardCeiling, perNaicsLimit = 25 } = args;
  const all: SamOpportunityRaw[] = [];
  const legs = [
    ...naicsCodes.map((naics) => ({ naics })),
    ...keywords.map((title) => ({ title })),
  ];
  for (const leg of legs) {
    const res = await samSearch({ ...leg, postedFrom, postedTo, limit: perNaicsLimit });
    for (const opp of res.opportunitiesData) {
      if (maxAwardCeiling !== undefined) {
        const ceil = opp.awardCeiling != null ? Number(opp.awardCeiling) : NaN;
        if (Number.isFinite(ceil) && ceil > maxAwardCeiling) continue;
      }
      all.push(opp);
    }
  }
  // dedupe by noticeId, keep first occurrence
  const seen = new Set<string>();
  return all.filter((o) => (seen.has(o.noticeId) ? false : (seen.add(o.noticeId), true)));
}
