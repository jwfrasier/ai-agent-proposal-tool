import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from '@/lib/db/schema';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

const sqlite = new Database(':memory:');
const memDb = drizzle(sqlite, { schema });
migrate(memDb, { migrationsFolder: './lib/db/migrations' });

const holder = vi.hoisted(() => ({
  db: null as unknown,
  scoreFn: null as unknown,
  generateDocFn: null as unknown,
  renderFn: null as unknown,
}));
holder.db = memDb;
holder.scoreFn = vi.fn();
holder.generateDocFn = vi.fn();
holder.renderFn = vi.fn();

vi.mock('@/lib/db/client', async () => {
  const schemaMod = await import('@/lib/db/schema');
  return { db: holder.db, schema: schemaMod };
});
vi.mock('@/lib/ai/score', () => ({ scoreOpportunity: holder.scoreFn }));
vi.mock('@/lib/ai/docs', () => ({ generateDoc: holder.generateDocFn }));
vi.mock('@/lib/docs/render', () => ({ renderMarkdownToPdf: holder.renderFn }));

let scorePost: typeof import('@/app/api/opportunities/[id]/score/route').POST;
let docPost: typeof import('@/app/api/opportunities/[id]/docs/route').POST;

beforeAll(async () => {
  scorePost = (await import('@/app/api/opportunities/[id]/score/route')).POST;
  docPost = (await import('@/app/api/opportunities/[id]/docs/route')).POST;
});

beforeEach(() => {
  (holder.scoreFn as ReturnType<typeof vi.fn>).mockReset();
  (holder.generateDocFn as ReturnType<typeof vi.fn>).mockReset();
  (holder.renderFn as ReturnType<typeof vi.fn>).mockReset();
  memDb.delete(schema.documents).run();
  memDb.delete(schema.scores).run();
  memDb.delete(schema.opportunities).run();
  memDb.delete(schema.companyProfile).run();
  memDb.insert(schema.companyProfile).values({
    id: 1, name: 'Acme', uei: 'X', naicsCodes: ['541512'], certifications: ['SB'],
    capabilities: 'IT', contactName: 'a', contactEmail: 'a@a.com',
  }).run();
  const now = new Date();
  memDb.insert(schema.opportunities).values({
    noticeId: 'n1', rawJson: {}, title: 't', agency: 'a', naics: '541512',
    firstSeenAt: now, lastSyncedAt: now, status: 'new',
  }).run();
});

describe('opportunity actions', () => {
  it('POST /score writes a score row', async () => {
    (holder.scoreFn as ReturnType<typeof vi.fn>).mockResolvedValue({
      fitScore: 70, recommendation: 'MAYBE',
      naicsMatch: { matched: true, reason: '' },
      capabilityMatch: { matched: true, reason: '' },
      setasideMatch: { matched: true, reason: '' },
      keyRequirements: [], risks: [], winThemes: [],
      model: 'claude-sonnet-4-6', promptTokens: 100, completionTokens: 50, costUsd: 0.001,
    });
    const res = await scorePost(new Request('http://x', { method: 'POST' }), {
      params: Promise.resolve({ id: 'n1' }),
    });
    expect(res.status).toBe(200);
    expect(memDb.select().from(schema.scores).all()).toHaveLength(1);
  });

  it('POST /docs writes markdown + pdf and returns id', async () => {
    process.env.PDF_OUTPUT_DIR = os.tmpdir();
    (holder.generateDocFn as ReturnType<typeof vi.fn>).mockResolvedValue({
      markdown: '# Hi', model: 'claude-sonnet-4-6',
      promptTokens: 1, completionTokens: 1, costUsd: 0,
    });
    (holder.renderFn as ReturnType<typeof vi.fn>).mockResolvedValue(Buffer.from('%PDF-fake'));
    const res = await docPost(
      new Request('http://x', {
        method: 'POST',
        body: JSON.stringify({ kind: 'analysis' }),
        headers: { 'content-type': 'application/json' },
      }),
      { params: Promise.resolve({ id: 'n1' }) },
    );
    expect(res.status).toBe(200);
    const doc = memDb.select().from(schema.documents).get();
    expect(doc?.kind).toBe('analysis');
    expect(fs.existsSync(doc!.pdfPath)).toBe(true);
  });
});
