import Link from 'next/link';
import { ScoreBadge } from './ScoreBadge';

export function TodaysPicks({
  picks,
}: {
  picks: Array<{ noticeId: string; title: string; agency: string; score: number; recommendation: string }>;
}) {
  if (picks.length === 0) {
    return <p className="text-sm text-muted-foreground">No new picks yet. Wait for the next daily run.</p>;
  }
  return (
    <ul className="divide-y">
      {picks.map((p) => (
        <li key={p.noticeId} className="flex items-center justify-between py-2">
          <div>
            <Link href={`/opps/${p.noticeId}`} className="font-medium hover:underline">{p.title}</Link>
            <p className="text-xs text-muted-foreground">{p.agency}</p>
          </div>
          <ScoreBadge score={p.score} recommendation={p.recommendation} />
        </li>
      ))}
    </ul>
  );
}
