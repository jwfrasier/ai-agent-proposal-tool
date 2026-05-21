import { samSearch } from './client';
import type { SamOpportunityRaw } from './schemas';

export interface SearchByProfileArgs {
  naicsCodes: string[];
  postedFrom: string; // YYYY-MM-DD
  postedTo?: string;
  maxAwardCeiling?: number;
  perNaicsLimit?: number;
}

export async function searchByProfile(args: SearchByProfileArgs): Promise<SamOpportunityRaw[]> {
  const { naicsCodes, postedFrom, postedTo, maxAwardCeiling, perNaicsLimit = 25 } = args;
  const all: SamOpportunityRaw[] = [];
  for (const naics of naicsCodes) {
    const res = await samSearch({ naics, postedFrom, postedTo, limit: perNaicsLimit });
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
