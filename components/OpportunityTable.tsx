'use client';
import Link from 'next/link';
import { ScoreBadge } from './ScoreBadge';

type Row = {
  noticeId: string;
  title: string;
  agency: string;
  naics: string | null;
  responseDeadline: string | null;
  awardCeiling: number | null;
  status: string;
  latestScore: { fitScore: number; recommendation: string } | null;
};

export function OpportunityTable({ rows }: { rows: Row[] }) {
  return (
    <table className="w-full text-sm">
      <thead className="text-left text-muted-foreground">
        <tr>
          <th className="py-2">Title</th><th>Agency</th><th>NAICS</th>
          <th>Ceiling</th><th>Deadline</th><th>Status</th><th>Score</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.noticeId} className="border-t">
            <td className="py-2"><Link href={`/opps/${r.noticeId}`} className="font-medium hover:underline">{r.title}</Link></td>
            <td>{r.agency}</td>
            <td>{r.naics ?? '-'}</td>
            <td>{r.awardCeiling != null ? `$${r.awardCeiling.toLocaleString()}` : '-'}</td>
            <td>{r.responseDeadline ? new Date(r.responseDeadline).toLocaleDateString() : '-'}</td>
            <td>{r.status}</td>
            <td><ScoreBadge score={r.latestScore?.fitScore ?? null} recommendation={r.latestScore?.recommendation} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
