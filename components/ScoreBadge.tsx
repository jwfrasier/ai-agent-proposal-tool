export function ScoreBadge({ score, recommendation }: { score: number | null; recommendation?: string | null }) {
  if (score == null) return <span className="text-xs text-muted-foreground">unscored</span>;
  const color =
    recommendation === 'GO' ? 'bg-green-100 text-green-900' :
    recommendation === 'NO_GO' ? 'bg-red-100 text-red-900' :
    'bg-amber-100 text-amber-900';
  return (
    <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${color}`}>
      {score} · {recommendation ?? 'MAYBE'}
    </span>
  );
}
