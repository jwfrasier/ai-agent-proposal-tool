import { NextResponse } from 'next/server';
import { desc } from 'drizzle-orm';
import { db, schema } from '@/lib/db/client';

export async function GET() {
  const rows = db.select().from(schema.cronRuns).orderBy(desc(schema.cronRuns.startedAt)).limit(30).all();
  return NextResponse.json(rows);
}
