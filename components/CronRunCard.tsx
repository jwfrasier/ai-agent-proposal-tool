type CronRun = {
  startedAt: string | Date;
  status: string;
  oppsFetched: number;
  oppsNew: number;
  oppsScored: number;
  totalCostUsd: number;
  costCapUsd: number;
  errorSummary?: string | null;
};

export function CronRunCard({ run }: { run: CronRun | null }) {
  if (!run) return <p className="text-sm text-muted-foreground">No cron runs yet.</p>;
  const icon = run.status === 'ok' ? '✓' : run.status === 'partial' ? '◐' : run.status === 'failed' ? '✗' : '⋯';
  return (
    <div className="rounded border p-3 text-sm">
      <div>
        <span className="font-semibold">{icon} {run.status}</span>
        <span className="text-muted-foreground"> · {new Date(run.startedAt).toLocaleString()}</span>
      </div>
      <div className="text-muted-foreground">
        {run.oppsFetched} fetched · {run.oppsNew} new · {run.oppsScored} scored · ${run.totalCostUsd.toFixed(2)} / ${run.costCapUsd.toFixed(2)}
      </div>
      {run.errorSummary && <div className="text-red-600">{run.errorSummary}</div>}
    </div>
  );
}
