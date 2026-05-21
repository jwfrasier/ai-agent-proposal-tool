import { NextResponse } from 'next/server';
import { db, schema } from '@/lib/db/client';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';

const PatchSchema = z.object({
  status: z.enum(['new', 'reviewed', 'shortlisted', 'bidding', 'submitted', 'passed']),
});

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const opp = db.select().from(schema.opportunities).where(eq(schema.opportunities.noticeId, id)).get();
  if (!opp) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const scores = db.select().from(schema.scores).where(eq(schema.scores.opportunityId, id)).orderBy(desc(schema.scores.createdAt)).all();
  const docs = db.select().from(schema.documents).where(eq(schema.documents.opportunityId, id)).orderBy(desc(schema.documents.createdAt)).all();
  return NextResponse.json({ opportunity: opp, scores, documents: docs });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const updated = db
    .update(schema.opportunities)
    .set({ status: parsed.data.status })
    .where(eq(schema.opportunities.noticeId, id))
    .returning()
    .get();
  if (!updated) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json(updated);
}
