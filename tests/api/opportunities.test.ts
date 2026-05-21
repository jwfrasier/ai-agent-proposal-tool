import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from '@/lib/db/schema';

const sqlite = new Database(':memory:');
const memDb = drizzle(sqlite, { schema });
migrate(memDb, { migrationsFolder: './lib/db/migrations' });

const holder = vi.hoisted(() => ({ db: null as unknown }));
holder.db = memDb;

vi.mock('@/lib/db/client', async () => {
  const schemaMod = await import('@/lib/db/schema');
  return { db: holder.db, schema: schemaMod };
});

let listOpps: typeof import('@/app/api/opportunities/route').GET;
let getOpp: typeof import('@/app/api/opportunities/[id]/route').GET;
let patchOpp: typeof import('@/app/api/opportunities/[id]/route').PATCH;

beforeAll(async () => {
  listOpps = (await import('@/app/api/opportunities/route')).GET;
  const detail = await import('@/app/api/opportunities/[id]/route');
  getOpp = detail.GET;
  patchOpp = detail.PATCH;
});

beforeEach(() => {
  memDb.delete(schema.scores).run();
  memDb.delete(schema.opportunities).run();
  const now = new Date();
  memDb.insert(schema.opportunities).values([
    { noticeId: 'a', rawJson: {}, title: 'A', agency: 'GSA', naics: '541512', firstSeenAt: now, lastSyncedAt: now, status: 'new' },
    { noticeId: 'b', rawJson: {}, title: 'B', agency: 'GSA', naics: '999', firstSeenAt: now, lastSyncedAt: now, status: 'shortlisted' },
  ]).run();
});

describe('/api/opportunities', () => {
  it('GET list returns all opps', async () => {
    const req = new Request('http://x/api/opportunities');
    const res = await listOpps(req);
    expect((await res.json()).length).toBe(2);
  });

  it('GET list filters by status', async () => {
    const req = new Request('http://x/api/opportunities?status=shortlisted');
    const res = await listOpps(req);
    const body = await res.json();
    expect(body.length).toBe(1);
    expect(body[0].noticeId).toBe('b');
  });

  it('GET :id returns 404 for unknown', async () => {
    const res = await getOpp(new Request('http://x'), { params: Promise.resolve({ id: 'zzz' }) });
    expect(res.status).toBe(404);
  });

  it('PATCH :id updates status', async () => {
    const req = new Request('http://x', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'bidding' }),
      headers: { 'content-type': 'application/json' },
    });
    const res = await patchOpp(req, { params: Promise.resolve({ id: 'a' }) });
    expect(res.status).toBe(200);
    const fresh = memDb.select().from(schema.opportunities).all().find((r) => r.noticeId === 'a');
    expect(fresh?.status).toBe('bidding');
  });
});
