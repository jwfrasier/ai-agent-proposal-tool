import { db, schema } from '@/lib/db/client';
import { desc, eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { OpportunityDetail } from '@/components/OpportunityDetail';

export const dynamic = 'force-dynamic';

export default async function OppDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const opp = db.select().from(schema.opportunities).where(eq(schema.opportunities.noticeId, id)).get();
  if (!opp) notFound();
  const scores = db.select().from(schema.scores).where(eq(schema.scores.opportunityId, id)).orderBy(desc(schema.scores.createdAt)).all();
  const documents = db.select().from(schema.documents).where(eq(schema.documents.opportunityId, id)).orderBy(desc(schema.documents.createdAt)).all();
  return <OpportunityDetail opp={opp as never} scores={scores as never} documents={documents as never} />;
}
