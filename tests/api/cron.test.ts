import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from '@/lib/db/schema';

const sqlite = new Database(':memory:');
const memDb = drizzle(sqlite, { schema });
migrate(memDb, { migrationsFolder: './lib/db/migrations' });

const holder = vi.hoisted(() => ({
  db: null as unknown,
  runDailyFn: null as unknown,
}));
holder.db = memDb;
holder.runDailyFn = vi.fn();

vi.mock('@/lib/db/client', async () => {
  const schemaMod = await import('@/lib/db/schema');
  return { db: holder.db, schema: schemaMod };
});
vi.mock('@/lib/pipeline/daily-run', () => ({ runDaily: holder.runDailyFn }));

let cronPost: typeof import('@/app/api/cron/run-daily/route').POST;
let runsGet: typeof import('@/app/api/cron/runs/route').GET;

beforeAll(async () => {
  cronPost = (await import('@/app/api/cron/run-daily/route')).POST;
  runsGet = (await import('@/app/api/cron/runs/route')).GET;
});

beforeEach(() => {
  (holder.runDailyFn as ReturnType<typeof vi.fn>).mockReset();
  memDb.delete(schema.cronRuns).run();
});

describe('/api/cron', () => {
  it('rejects requests without secret', async () => {
    const res = await cronPost(new Request('http://x', { method: 'POST' }));
    expect(res.status).toBe(401);
  });

  it('runs pipeline with correct secret', async () => {
    (holder.runDailyFn as ReturnType<typeof vi.fn>).mockResolvedValue({
      cronRunId: 1, status: 'ok', oppsFetched: 0, oppsNew: 0, oppsScored: 0, totalCostUsd: 0, errorSummary: null,
    });
    const res = await cronPost(new Request('http://x', {
      method: 'POST',
      headers: { 'x-cron-secret': 'test-cron-secret-1234' },
    }));
    expect(res.status).toBe(200);
    expect(holder.runDailyFn).toHaveBeenCalled();
  });

  it('GET /runs returns history', async () => {
    memDb.insert(schema.cronRuns).values({
      startedAt: new Date(), status: 'ok', costCapUsd: 2, logs: [],
    }).run();
    const res = await runsGet();
    const body = await res.json();
    expect(body.length).toBeGreaterThan(0);
  });
});
