import type { Opportunity, CompanyProfile } from '../db/schema';

export function rankCandidates(
  opps: Opportunity[],
  profile: Pick<CompanyProfile, 'naicsCodes' | 'certifications'>,
): Opportunity[] {
  const now = Date.now();
  const naicsSet = new Set(profile.naicsCodes);
  const certsLower = new Set(profile.certifications.map((c) => c.toLowerCase()));

  const fresh = opps.filter((o) => !o.responseDeadline || o.responseDeadline.getTime() > now);

  const scored = fresh.map((o) => {
    let score = 0;
    if (o.naics && naicsSet.has(o.naics)) score += 50;
    if (o.setAside) {
      const lower = o.setAside.toLowerCase();
      for (const c of certsLower) {
        if (lower.includes(c)) {
          score += 30;
          break;
        }
      }
    }
    // recency: newer posted = higher score, up to 10
    if (o.postedAt) {
      const ageDays = (now - o.postedAt.getTime()) / 86400_000;
      score += Math.max(0, 10 - ageDays);
    }
    // ceiling fit: prefer opps within sweet spot $50k–$350k
    if (o.awardCeiling != null) {
      if (o.awardCeiling >= 50_000 && o.awardCeiling <= 350_000) score += 10;
    }
    return { o, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.o);
}
