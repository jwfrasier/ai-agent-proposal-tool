import { db, schema } from '@/lib/db/client';
import { desc, eq } from 'drizzle-orm';
import { TodaysPicks } from '@/components/TodaysPicks';
import { PipelineKanban } from '@/components/PipelineKanban';
import { CronRunCard } from '@/components/CronRunCard';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const lastRun = db.select().from(schema.cronRuns).orderBy(desc(schema.cronRuns.startedAt)).limit(1).get();
  const lastRunStart = lastRun?.startedAt ?? new Date(Date.now() - 86400_000);

  const allOpps = db.select().from(schema.opportunities).all();
  const newSinceLastRun = allOpps.filter((o) => o.firstSeenAt.getTime() >= lastRunStart.getTime());

  const picks = newSinceLastRun
    .map((o) => {
      const s = db.select().from(schema.scores).where(eq(schema.scores.opportunityId, o.noticeId)).orderBy(desc(schema.scores.createdAt)).limit(1).get();
      return s ? { noticeId: o.noticeId, title: o.title, agency: o.agency, score: s.fitScore, recommendation: s.recommendation } : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const columns = ['new', 'shortlisted', 'bidding', 'submitted'].map((status) => ({
    status,
    rows: allOpps.filter((o) => o.status === status).map((o) => ({ noticeId: o.noticeId, title: o.title })),
  }));

  return (
    <div className="space-y-8">
      <section>
        <h1 className="mb-2 text-2xl font-semibold">Today's picks</h1>
        <TodaysPicks picks={picks} />
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Pipeline</h2>
        <PipelineKanban cols={columns} />
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Last cron run</h2>
        <CronRunCard run={lastRun as never} />
      </section>
    </div>
  );
}
