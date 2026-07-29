import { describe, it, expect, vi, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from '@/lib/db/schema';

vi.mock('@/lib/sam/search', () => ({ searchByProfile: vi.fn() }));
vi.mock('@/lib/ai/score', () => ({ scoreOpportunity: vi.fn() }));
vi.mock('@/lib/ai/triage', () => ({ triageOpportunity: vi.fn() }));

import { searchByProfile } from '@/lib/sam/search';
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

const samOpp = {
  noticeId: 's1', title: 'Help', fullParentPathName: 'GSA',
  solicitationNumber: 'SOL-DUP-1',
  naicsCode: '541512', typeOfSetAsideDescription: 'Small Business',
  postedDate: '2026-05-19', responseDeadLine: '2026-12-01T17:00:00Z',
  awardCeiling: '150000', description: 'Tier 1',
};

describe('runDaily', () => {
  beforeEach(() => {
    vi.mocked(searchByProfile).mockReset();
    vi.mocked(scoreOpportunity).mockReset();
    vi.mocked(triageOpportunity).mockReset();
    vi.mocked(triageOpportunity).mockResolvedValue({
      verdict: 'advance', reason: 'ok', model: 'claude-haiku-4-5-20251001',
      promptTokens: 100, completionTokens: 10, costUsd: 0.0002, traceId: 't',
    } as never);
  });

  it('happy path: searches, inserts opps, scores, writes cron_run', async () => {
    const db = freshDb();
    seedProfile(db);
    vi.mocked(searchByProfile).mockResolvedValue([samOpp as never]);
    vi.mocked(scoreOpportunity).mockResolvedValue({
      fitScore: 80, recommendation: 'GO',
      naicsMatch: { matched: true, reason: '' },
      capabilityMatch: { matched: true, reason: '' },
      setasideMatch: { matched: true, reason: '' },
      keyRequirements: [], risks: [], winThemes: [],
      model: 'claude-sonnet-4-6', promptTokens: 1000, completionTokens: 200, costUsd: 0.006,
    });

    const summary = await runDaily({ db: db as never, costCapUsd: 1.0, topN: 5 });
    expect(summary.status).toBe('ok');
    expect(summary.oppsScored).toBe(1);
    const row = db.select().from(schema.opportunities).get();
    expect(row?.noticeId).toBe('s1');
    const score = db.select().from(schema.scores).get();
    expect(score?.fitScore).toBe(80);
  });

  it('stops scoring when budget exhausted, marks partial', async () => {
    const db = freshDb();
    seedProfile(db);
    vi.mocked(searchByProfile).mockResolvedValue([
      { ...samOpp, noticeId: 's1' } as never,
      { ...samOpp, noticeId: 's2' } as never,
    ]);
    vi.mocked(scoreOpportunity).mockResolvedValue({
      fitScore: 50, recommendation: 'MAYBE',
      naicsMatch: { matched: true, reason: '' },
      capabilityMatch: { matched: true, reason: '' },
      setasideMatch: { matched: true, reason: '' },
      keyRequirements: [], risks: [], winThemes: [],
      model: 'claude-sonnet-4-6', promptTokens: 1000, completionTokens: 200, costUsd: 0.80,
    });

    const summary = await runDaily({ db: db as never, costCapUsd: 1.0, topN: 5 });
    expect(summary.status).toBe('partial');
    expect(summary.oppsScored).toBe(1);
  });

  it('records failure if search throws', async () => {
    const db = freshDb();
    seedProfile(db);
    vi.mocked(searchByProfile).mockRejectedValue(new Error('SAM down'));
    const summary = await runDaily({ db: db as never, costCapUsd: 1.0, topN: 5 });
    expect(summary.status).toBe('failed');
    expect(summary.errorSummary).toMatch(/SAM down/);
  });

  it('dedups a repeated solicitation number without a second score call', async () => {
    const db = freshDb();
    seedProfile(db);
    vi.mocked(searchByProfile).mockResolvedValue([
      { ...samOpp, noticeId: 'a', description: 'Custom portal build' } as never,
      { ...samOpp, noticeId: 'b', description: 'Custom portal build' } as never,
    ]);
    vi.mocked(scoreOpportunity).mockResolvedValue({
      fitScore: 70, recommendation: 'MAYBE',
      naicsMatch: { matched: true, reason: '' }, capabilityMatch: { matched: true, reason: '' },
      setasideMatch: { matched: true, reason: '' }, keyRequirements: [], risks: [], winThemes: [],
      model: 'claude-sonnet-4-6', promptTokens: 1000, completionTokens: 200, costUsd: 0.006,
    } as never);

    // Inject the shared solicitation number onto both stored opps' rawJson.
    await runDaily({ db: db as never, costCapUsd: 5.0, topN: 5, postedFromOverride: '2026-05-18' });

    const scoreCalls = vi.mocked(scoreOpportunity).mock.calls.length;
    const dupRows = db.select().from(schema.scores).all().filter((s) => s.model.startsWith('dup:'));
    expect(scoreCalls).toBe(1);       // only ONE real score for the duplicate pair
    expect(dupRows.length).toBe(1);   // the second is a dup marker
  });

  it('triage reject persists a triage marker and skips the Sonnet score', async () => {
    const db = freshDb();
    seedProfile(db);
    vi.mocked(searchByProfile).mockResolvedValue([{ ...samOpp, noticeId: 'a', solicitationNumber: 'SOL-A' } as never]);
    vi.mocked(triageOpportunity).mockResolvedValue({
      verdict: 'reject', reason: 'commodity buy', model: 'claude-haiku-4-5-20251001',
      promptTokens: 100, completionTokens: 8, costUsd: 0.0003, traceId: 't',
    } as never);

    const summary = await runDaily({ db: db as never, costCapUsd: 5.0, topN: 5, postedFromOverride: '2026-05-18' });

    expect(vi.mocked(scoreOpportunity).mock.calls.length).toBe(0);
    const rows = db.select().from(schema.scores).all();
    expect(rows.some((r) => r.model === 'triage:haiku')).toBe(true);
    expect(summary.totalCostUsd).toBeCloseTo(0.0003, 6); // triage cost counted
  });

  it('triage advance proceeds to the Sonnet score', async () => {
    const db = freshDb();
    seedProfile(db);
    vi.mocked(searchByProfile).mockResolvedValue([{ ...samOpp, noticeId: 'a', solicitationNumber: 'SOL-A' } as never]);
    vi.mocked(scoreOpportunity).mockResolvedValue({
      fitScore: 75, recommendation: 'GO',
      naicsMatch: { matched: true, reason: '' }, capabilityMatch: { matched: true, reason: '' },
      setasideMatch: { matched: true, reason: '' }, keyRequirements: [], risks: [], winThemes: [],
      model: 'claude-sonnet-4-6', promptTokens: 1000, completionTokens: 200, costUsd: 0.006,
    } as never);
    // triageOpportunity default mock = advance (set in beforeEach)

    await runDaily({ db: db as never, costCapUsd: 5.0, topN: 5, postedFromOverride: '2026-05-18' });
    expect(vi.mocked(scoreOpportunity).mock.calls.length).toBe(1);
  });

  it('a same-run duplicate of a triage-rejected solicitation is deduped, not re-triaged', async () => {
    const db = freshDb();
    seedProfile(db);
    vi.mocked(searchByProfile).mockResolvedValue([
      { ...samOpp, noticeId: 'a', solicitationNumber: 'SOL-DUP' } as never,
      { ...samOpp, noticeId: 'b', solicitationNumber: 'SOL-DUP' } as never,
    ]);
    vi.mocked(triageOpportunity).mockResolvedValue({
      verdict: 'reject', reason: 'commodity buy', model: 'claude-haiku-4-5-20251001',
      promptTokens: 100, completionTokens: 8, costUsd: 0.0003, traceId: 't',
    } as never);

    await runDaily({ db: db as never, costCapUsd: 5.0, topN: 5, postedFromOverride: '2026-05-18' });

    expect(vi.mocked(triageOpportunity).mock.calls.length).toBe(1);
    const rows = db.select().from(schema.scores).all();
    expect(rows.filter((r) => r.model === 'triage:haiku').length).toBe(1);
    expect(rows.filter((r) => r.model.startsWith('dup:')).length).toBe(1);
  });

  it('triageOnly: runs triage, skips Sonnet, reports projected cost', async () => {
    const db = freshDb();
    seedProfile(db);
    vi.mocked(searchByProfile).mockResolvedValue([
      { ...samOpp, noticeId: 'a', solicitationNumber: 'SOL-A' } as never,
      { ...samOpp, noticeId: 'b', solicitationNumber: 'SOL-B' } as never,
    ]);
    // both advance (default mock)
    const summary = await runDaily({
      db: db as never, costCapUsd: 5.0, topN: 5, triageOnly: true, postedFromOverride: '2026-05-18',
    });

    expect(vi.mocked(scoreOpportunity).mock.calls.length).toBe(0);
    expect(summary.triageAdvanced).toBe(2);
    expect(summary.projectedSonnetCostUsd).toBeGreaterThan(0);
    expect(summary.status).toBe('ok');
  });
});
