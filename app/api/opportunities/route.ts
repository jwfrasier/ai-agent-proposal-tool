import { NextResponse } from 'next/server';
import { db, schema } from '@/lib/db/client';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';

const QuerySchema = z.object({
  status: z.enum(['new', 'reviewed', 'shortlisted', 'bidding', 'submitted', 'passed']).optional(),
  naics: z.string().optional(),
  minScore: z.coerce.number().int().min(0).max(100).optional(),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_query' }, { status: 400 });
  const q = parsed.data;

  const conds = [];
  if (q.status) conds.push(eq(schema.opportunities.status, q.status));
  if (q.naics) conds.push(eq(schema.opportunities.naics, q.naics));

  const rows = db
    .select()
    .from(schema.opportunities)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(schema.opportunities.firstSeenAt))
    .all();

  const enriched = rows.map((o) => {
    const score = db
      .select()
      .from(schema.scores)
      .where(eq(schema.scores.opportunityId, o.noticeId))
      .orderBy(desc(schema.scores.createdAt))
      .limit(1)
      .get();
    return { ...o, latestScore: score ?? null };
  });

  const filtered = q.minScore != null
    ? enriched.filter((r) => (r.latestScore?.fitScore ?? -1) >= q.minScore!)
    : enriched;

  return NextResponse.json(filtered);
}
