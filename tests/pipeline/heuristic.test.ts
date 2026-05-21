import { describe, it, expect } from 'vitest';
import { rankCandidates } from '@/lib/pipeline/heuristic';

const profile = { naicsCodes: ['541512'], certifications: ['SB'] } as never;

function opp(over: Record<string, unknown> = {}) {
  return {
    noticeId: 'n',
    title: 't', agency: 'a',
    naics: '541512', setAside: 'Small Business',
    awardCeiling: 100_000,
    responseDeadline: new Date(Date.now() + 14 * 86400_000),
    postedAt: new Date(Date.now() - 1 * 86400_000),
    description: '', rawJson: {}, placeOfPerformance: '',
    firstSeenAt: new Date(), lastSyncedAt: new Date(), status: 'new' as const,
    ...over,
  };
}

describe('rankCandidates', () => {
  it('ranks NAICS-exact and set-aside match above non-matches', () => {
    const a = opp({ noticeId: 'a' });
    const b = opp({ noticeId: 'b', naics: '999999', setAside: null });
    const ranked = rankCandidates([b, a] as never, profile);
    expect(ranked[0]!.noticeId).toBe('a');
  });

  it('drops opportunities past their response deadline', () => {
    const expired = opp({ noticeId: 'x', responseDeadline: new Date(Date.now() - 86400_000) });
    expect(rankCandidates([expired] as never, profile)).toHaveLength(0);
  });
});
