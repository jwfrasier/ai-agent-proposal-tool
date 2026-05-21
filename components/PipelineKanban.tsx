import Link from 'next/link';

type Col = { status: string; rows: Array<{ noticeId: string; title: string }> };

export function PipelineKanban({ cols }: { cols: Col[] }) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {cols.map((c) => (
        <div key={c.status} className="rounded border p-3">
          <h3 className="mb-2 text-sm font-semibold capitalize">
            {c.status} <span className="text-muted-foreground">({c.rows.length})</span>
          </h3>
          <ul className="space-y-1">
            {c.rows.slice(0, 8).map((r) => (
              <li key={r.noticeId} className="text-sm">
                <Link href={`/opps/${r.noticeId}`} className="hover:underline">{r.title}</Link>
              </li>
            ))}
            {c.rows.length > 8 && <li className="text-xs text-muted-foreground">+{c.rows.length - 8} more</li>}
          </ul>
        </div>
      ))}
    </div>
  );
}
