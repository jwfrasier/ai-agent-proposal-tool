import { db, schema } from '@/lib/db/client';
import { desc, eq } from 'drizzle-orm';
import { OpportunityTable } from '@/components/OpportunityTable';

export const dynamic = 'force-dynamic';

export default async function OppsPage() {
  const opps = db.select().from(schema.opportunities).orderBy(desc(schema.opportunities.firstSeenAt)).all();
  const rows = opps.map((o) => {
    const score = db.select().from(schema.scores).where(eq(schema.scores.opportunityId, o.noticeId)).orderBy(desc(schema.scores.createdAt)).limit(1).get();
    return {
      noticeId: o.noticeId,
      title: o.title,
      agency: o.agency,
      naics: o.naics,
      responseDeadline: o.responseDeadline ? o.responseDeadline.toISOString() : null,
      awardCeiling: o.awardCeiling,
      status: o.status,
      latestScore: score ? { fitScore: score.fitScore, recommendation: score.recommendation } : null,
    };
  });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">All opportunities</h1>
      <OpportunityTable rows={rows} />
    </div>
  );
}
