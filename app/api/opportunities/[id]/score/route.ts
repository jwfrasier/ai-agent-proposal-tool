import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db, schema } from '@/lib/db/client';
import { scoreOpportunity } from '@/lib/ai/score';

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const opp = db.select().from(schema.opportunities).where(eq(schema.opportunities.noticeId, id)).get();
  if (!opp) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const profile = db.select().from(schema.companyProfile).where(eq(schema.companyProfile.id, 1)).get();
  if (!profile) return NextResponse.json({ error: 'no_profile' }, { status: 400 });

  const scored = await scoreOpportunity(opp, profile);
  const inserted = db.insert(schema.scores).values({
    opportunityId: opp.noticeId,
    profileVersion: profile.version,
    fitScore: scored.fitScore,
    recommendation: scored.recommendation,
    naicsMatch: scored.naicsMatch,
    capabilityMatch: scored.capabilityMatch,
    setasideMatch: scored.setasideMatch,
    keyRequirements: scored.keyRequirements,
    risks: scored.risks,
    winThemes: scored.winThemes,
    model: scored.model,
    promptTokens: scored.promptTokens,
    completionTokens: scored.completionTokens,
    costUsd: scored.costUsd,
    createdAt: new Date(),
  }).returning().get();
  return NextResponse.json(inserted);
}
