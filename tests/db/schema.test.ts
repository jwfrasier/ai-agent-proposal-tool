import { describe, it, expect } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

function freshDb() {
  const sqlite = new Database(':memory:');
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: './lib/db/migrations' });
  return { db, sqlite };
}

describe('schema', () => {
  it('round-trips a company profile with JSON columns', () => {
    const { db } = freshDb();
    db.insert(schema.companyProfile).values({
      id: 1,
      name: 'Acme',
      uei: 'UEI123',
      naicsCodes: ['541511', '541512'],
      certifications: ['SB', 'WOSB'],
      capabilities: 'We do things.',
      contactName: 'Joe',
      contactEmail: 'joe@example.com',
    }).run();

    const row = db.select().from(schema.companyProfile).where(eq(schema.companyProfile.id, 1)).get();
    expect(row?.naicsCodes).toEqual(['541511', '541512']);
    expect(row?.version).toBe(1);
  });

  it('inserts opportunity with default new status', () => {
    const { db } = freshDb();
    const now = new Date();
    db.insert(schema.opportunities).values({
      noticeId: 'n1',
      rawJson: { foo: 'bar' },
      title: 't',
      agency: 'a',
      firstSeenAt: now,
      lastSyncedAt: now,
    }).run();
    const row = db.select().from(schema.opportunities).get();
    expect(row?.status).toBe('new');
  });
});
