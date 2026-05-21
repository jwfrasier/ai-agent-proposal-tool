import { describe, it, expect, vi, beforeAll } from 'vitest';
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

let GET: typeof import('@/app/api/profile/route').GET;
let PUT: typeof import('@/app/api/profile/route').PUT;

beforeAll(async () => {
  const mod = await import('@/app/api/profile/route');
  GET = mod.GET;
  PUT = mod.PUT;
});

describe('/api/profile', () => {
  it('GET returns 404 when no profile', async () => {
    const res = await GET();
    expect(res.status).toBe(404);
  });

  it('PUT creates a profile and GET returns it', async () => {
    const req = new Request('http://localhost/api/profile', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Acme', uei: 'UEI1', naicsCodes: ['541512'],
        certifications: ['SB'], capabilities: 'IT',
        contactName: 'a', contactEmail: 'a@a.com',
      }),
    });
    const putRes = await PUT(req);
    expect(putRes.status).toBe(200);
    const body = await putRes.json();
    expect(body.version).toBe(1);

    const getRes = await GET();
    expect(getRes.status).toBe(200);
    expect((await getRes.json()).name).toBe('Acme');
  });

  it('PUT bumps version on update', async () => {
    const req = new Request('http://localhost/api/profile', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Acme2', uei: 'UEI1', naicsCodes: ['541511'],
        certifications: ['SB'], capabilities: 'IT2',
        contactName: 'a', contactEmail: 'a@a.com',
      }),
    });
    const res = await PUT(req);
    const body = await res.json();
    expect(body.version).toBe(2);
  });

  it('PUT rejects invalid body', async () => {
    const req = new Request('http://localhost/api/profile', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: '' }),
    });
    const res = await PUT(req);
    expect(res.status).toBe(400);
  });
});
