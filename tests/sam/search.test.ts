import { describe, it, expect, vi, beforeEach } from 'vitest';
import fixture from '../fixtures/sam-search-response.json';

vi.mock('@/lib/sam/client', () => ({
  samSearch: vi.fn(),
}));

import { samSearch } from '@/lib/sam/client';
import { searchByProfile } from '@/lib/sam/search';

describe('searchByProfile', () => {
  beforeEach(() => { vi.mocked(samSearch).mockReset(); });

  it('fans out one call per NAICS and merges results', async () => {
    vi.mocked(samSearch).mockResolvedValue(fixture as never);
    const opps = await searchByProfile({
      naicsCodes: ['541511', '541512'],
      postedFrom: '2026-05-01',
      maxAwardCeiling: 350_000,
    });
    expect(samSearch).toHaveBeenCalledTimes(2);
    // Two NAICS calls each return the same 2 opps; dedupe by noticeId leaves 2
    expect(opps).toHaveLength(2);
  });

  it('filters out opps over the maxAwardCeiling', async () => {
    const big = {
      ...fixture,
      opportunitiesData: [{ ...fixture.opportunitiesData[0], awardCeiling: '500000' }],
    };
    vi.mocked(samSearch).mockResolvedValue(big as never);
    const opps = await searchByProfile({
      naicsCodes: ['541511'],
      postedFrom: '2026-05-01',
      maxAwardCeiling: 350_000,
    });
    expect(opps).toHaveLength(0);
  });
});
