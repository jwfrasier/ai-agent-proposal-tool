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

describe('searchByProfile keyword leg', () => {
  beforeEach(() => { vi.mocked(samSearch).mockReset(); });

  it('fans out one title search per keyword in addition to NAICS, and dedupes', async () => {
    vi.mocked(samSearch).mockResolvedValue(fixture as never);
    const opps = await searchByProfile({
      naicsCodes: ['541511'],
      keywords: ['Moodle', 'Learning Management System'],
      postedFrom: '2026-05-01',
    });
    expect(samSearch).toHaveBeenCalledTimes(3);
    const calls = vi.mocked(samSearch).mock.calls.map((c) => c[0]);
    expect(calls[0]).toMatchObject({ naics: '541511' });
    expect(calls[1]).toMatchObject({ title: 'Moodle' });
    expect(calls[2]).toMatchObject({ title: 'Learning Management System' });
    expect(opps).toHaveLength(2);
  });

  it('applies the award ceiling to keyword hits too', async () => {
    const big = { ...fixture, opportunitiesData: [{ ...fixture.opportunitiesData[0], awardCeiling: '900000' }] };
    vi.mocked(samSearch).mockResolvedValue(big as never);
    const opps = await searchByProfile({ naicsCodes: [], keywords: ['Moodle'], postedFrom: '2026-05-01', maxAwardCeiling: 350_000 });
    expect(opps).toHaveLength(0);
  });
});
