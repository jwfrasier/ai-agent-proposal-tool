import { describe, it, expect, vi, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from '@/lib/db/schema';

vi.mock('@/lib/sam/search', () => ({ searchByProfile: vi.fn() }));
vi.mock('@/lib/sam/client', () => ({ fetchSamDescription: vi.fn() }));
vi.mock('@/lib/ai/score', () => ({ scoreOpportunity: vi.fn() }));
vi.mock('@/lib/ai/triage', () => ({ triageOpportunity: vi.fn() }));

import { searchByProfile } from '@/lib/sam/search';
import { fetchSamDescription } from '@/lib/sam/client';
import { scoreOpportunity } from '@/lib/ai/score';
import { triageOpportunity } from '@/lib/ai/triage';
import { runDaily } from '@/lib/pipeline/daily-run';

function freshDb() {
  const sqlite = new Database(':memory:');
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: './lib/db/migrations' });
  return db;
}

function seedProfile(db: ReturnType<typeof freshDb>) {
  db.insert(schema.companyProfile).values({
    id: 1, name: 'Acme', uei: 'X',
    naicsCodes: ['541512'], certifications: ['SB'],
    capabilities: 'IT', contactName: 'a', contactEmail: 'a@a.com',
  }).run();
}

// SAM search results carry `description` as a URL to the noticedesc endpoint.
function urlDescOpp(noticeId: string, solicitationNumber: string) {
  return {
    noticeId, title: 'Help', fullParentPathName: 'GSA',
    solicitationNumber,
    naicsCode: '541512', typeOfSetAsideDescription: 'Small Business',
    postedDate: '2026-05-19', responseDeadLine: '2026-12-01T17:00:00Z',
    awardCeiling: '150000',
    description: `https://api.sam.gov/prod/opportunities/v1/noticedesc?noticeid=${noticeId}`,
  };
}

const goodScore = {
  fitScore: 75, recommendation: 'GO',
  naicsMatch: { matched: true, reason: '' },
  capabilityMatch: { matched: true, reason: '' },
  setasideMatch: { matched: true, reason: '' },
  keyRequirements: [], risks: [], winThemes: [],
  model: 'claude-sonnet-4-6', promptTokens: 1000, completionTokens: 200, costUsd: 0.006,
};

describe('runDaily: description fetch failure handling', () => {
  beforeEach(() => {
    vi.mocked(searchByProfile).mockReset();
    vi.mocked(fetchSamDescription).mockReset();
    vi.mocked(scoreOpportunity).mockReset();
    vi.mocked(triageOpportunity).mockReset();
    vi.mocked(triageOpportunity).mockResolvedValue({
      verdict: 'advance', reason: 'ok', model: 'claude-haiku-4-5-20251001',
      promptTokens: 100, completionTokens: 10, costUsd: 0.0002, traceId: 't',
    } as never);
  });

  it('retries the fetch once, then writes a zero-cost desc_fetch_failed marker and spends no AI', async () => {
    const db = freshDb();
    seedProfile(db);
    vi.mocked(searchByProfile).mockResolvedValue([urlDescOpp('a', 'SOL-A') as never]);
    vi.mocked(fetchSamDescription).mockResolvedValue(null);

    const summary = await runDaily({ db: db as never, costCapUsd: 5.0, topN: 5, postedFromOverride: '2026-05-18' });

    expect(vi.mocked(fetchSamDescription).mock.calls.length).toBe(2); // initial + one retry
    expect(vi.mocked(triageOpportunity).mock.calls.length).toBe(0);   // no Haiku spend
    expect(vi.mocked(scoreOpportunity).mock.calls.length).toBe(0);    // no Sonnet spend
    expect(summary.totalCostUsd).toBe(0);
    expect(summary.status).toBe('ok');
    expect(summary.descFetchFailed).toBe(1);

    const rows = db.select().from(schema.scores).all();
    expect(rows.length).toBe(1);
    expect(rows[0].model).toBe('desc_fetch_failed');
    expect(rows[0].costUsd).toBe(0);
    expect(rows[0].promptTokens).toBe(0);

    // The failed count is visible in the run's structured logs.
    const run = db.select({ logs: schema.cronRuns.logs }).from(schema.cronRuns).get();
    expect(JSON.stringify(run?.logs)).toContain('descFetchFailed');
  });

  it('marker does not block the next run: opportunity is re-attempted, scored, and the marker superseded', async () => {
    const db = freshDb();
    seedProfile(db);
    vi.mocked(searchByProfile).mockResolvedValue([urlDescOpp('a', 'SOL-A') as never]);

    // Run 1: description fetch fails both attempts -> marker, no AI.
    vi.mocked(fetchSamDescription).mockResolvedValue(null);
    const run1 = await runDaily({ db: db as never, costCapUsd: 5.0, topN: 5, postedFromOverride: '2026-05-18' });
    expect(run1.descFetchFailed).toBe(1);
    expect(vi.mocked(scoreOpportunity).mock.calls.length).toBe(0);
    expect(db.select().from(schema.scores).all().filter((r) => r.model === 'desc_fetch_failed').length).toBe(1);

    // Run 2: fetch succeeds -> opportunity must NOT be considered "already scored".
    vi.mocked(fetchSamDescription).mockReset().mockResolvedValue('Real description: custom portal build for GSA.');
    vi.mocked(scoreOpportunity).mockResolvedValue(goodScore as never);
    const run2 = await runDaily({ db: db as never, costCapUsd: 5.0, topN: 5, postedFromOverride: '2026-05-18' });

    expect(run2.descFetchFailed).toBe(0);
    expect(vi.mocked(scoreOpportunity).mock.calls.length).toBe(1); // triaged + scored normally
    const rows = db.select().from(schema.scores).all();
    expect(rows.filter((r) => r.model === 'claude-sonnet-4-6').length).toBe(1);
    expect(rows.filter((r) => r.model === 'desc_fetch_failed').length).toBe(0); // superseded

    // Resolved description persisted on the opportunity.
    const opp = db.select().from(schema.opportunities).get();
    expect(opp?.description).toContain('Real description');
  });

  it('a desc_fetch_failed marker does not poison solicitation-number dedup', async () => {
    const db = freshDb();
    seedProfile(db);

    // Run 1: notice "a" (SOL-DUP) fails its description fetch -> marker only.
    vi.mocked(searchByProfile).mockResolvedValue([urlDescOpp('a', 'SOL-DUP') as never]);
    vi.mocked(fetchSamDescription).mockResolvedValue(null);
    await runDaily({ db: db as never, costCapUsd: 5.0, topN: 5, postedFromOverride: '2026-05-18' });

    // Run 2: notice "b" reposts SOL-DUP with an inline (non-URL) description.
    // The marker for "a" must not make "b" look like a duplicate of a scored solicitation.
    vi.mocked(searchByProfile).mockResolvedValue([
      { ...urlDescOpp('b', 'SOL-DUP'), description: 'Inline description: custom portal build.' } as never,
    ]);
    vi.mocked(scoreOpportunity).mockResolvedValue(goodScore as never);
    await runDaily({ db: db as never, costCapUsd: 5.0, topN: 5, postedFromOverride: '2026-05-18' });

    const rows = db.select().from(schema.scores).all();
    expect(rows.filter((r) => r.opportunityId === 'b' && r.model === 'claude-sonnet-4-6').length).toBe(1);
    expect(rows.filter((r) => r.opportunityId === 'b' && r.model.startsWith('dup:')).length).toBe(0);
  });
});
