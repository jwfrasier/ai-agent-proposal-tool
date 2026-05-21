'use client';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { ScoreBadge } from './ScoreBadge';

type DocKind = 'capability' | 'analysis' | 'proposal' | 'compliance_matrix';

type Score = {
  id: number;
  fitScore: number;
  recommendation: string;
  naicsMatch: { matched: boolean; reason: string };
  capabilityMatch: { matched: boolean; reason: string };
  setasideMatch: { matched: boolean; reason: string };
};

type Doc = {
  id: number;
  kind: string;
  createdAt: string | Date;
  pdfPath: string;
};

type Opp = {
  noticeId: string;
  title: string;
  agency: string;
  naics: string | null;
  setAside: string | null;
  status: string;
  description: string | null;
};

export function OpportunityDetail({
  opp,
  scores,
  documents,
}: {
  opp: Opp;
  scores: Score[];
  documents: Doc[];
}) {
  const [pending] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  async function rescore() {
    setMsg('Scoring…');
    const res = await fetch(`/api/opportunities/${opp.noticeId}/score`, { method: 'POST' });
    setMsg(res.ok ? 'Score updated. Reload page to see.' : `Failed: ${res.status}`);
  }
  async function makeDoc(kind: DocKind) {
    setMsg(`Generating ${kind}…`);
    const res = await fetch(`/api/opportunities/${opp.noticeId}/docs`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ kind }),
    });
    setMsg(res.ok ? `${kind} generated. Reload to see.` : `Failed: ${res.status}`);
  }
  async function setStatus(status: string) {
    await fetch(`/api/opportunities/${opp.noticeId}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setMsg(`Marked ${status}.`);
  }

  const latest = scores[0];
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">{opp.title}</h1>
        <p className="text-sm text-muted-foreground">{opp.agency} · NAICS {opp.naics ?? 'n/a'} · {opp.setAside ?? 'no set-aside'}</p>
      </header>

      <section className="rounded border p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Score</h2>
          <ScoreBadge score={latest?.fitScore ?? null} recommendation={latest?.recommendation} />
        </div>
        {latest && (
          <dl className="grid grid-cols-3 gap-2 text-sm">
            <div><dt className="text-muted-foreground">NAICS</dt><dd>{latest.naicsMatch.matched ? '✓' : '✗'} {latest.naicsMatch.reason}</dd></div>
            <div><dt className="text-muted-foreground">Capability</dt><dd>{latest.capabilityMatch.matched ? '✓' : '✗'} {latest.capabilityMatch.reason}</dd></div>
            <div><dt className="text-muted-foreground">Set-aside</dt><dd>{latest.setasideMatch.matched ? '✓' : '✗'} {latest.setasideMatch.reason}</dd></div>
          </dl>
        )}
        <Button onClick={rescore} disabled={pending} variant="outline" size="sm">Re-score</Button>
      </section>

      <section className="rounded border p-4 space-y-2">
        <h2 className="font-medium">Status</h2>
        <div className="flex gap-2">
          {['new', 'reviewed', 'shortlisted', 'bidding', 'submitted', 'passed'].map((s) => (
            <Button key={s} variant={opp.status === s ? 'default' : 'outline'} size="sm" onClick={() => setStatus(s)}>{s}</Button>
          ))}
        </div>
      </section>

      <section className="rounded border p-4 space-y-2">
        <h2 className="font-medium">Documents</h2>
        <div className="flex flex-wrap gap-2">
          {(['capability', 'analysis', 'proposal', 'compliance_matrix'] as DocKind[]).map((k) => (
            <Button key={k} variant="outline" size="sm" onClick={() => makeDoc(k)}>Generate {k}</Button>
          ))}
        </div>
        <ul className="text-sm">
          {documents.map((d) => (
            <li key={d.id}>{d.kind} · {new Date(d.createdAt).toLocaleString()} · <span className="font-mono text-xs">{d.pdfPath}</span></li>
          ))}
        </ul>
      </section>

      <section className="rounded border p-4 space-y-2">
        <h2 className="font-medium">Description</h2>
        <pre className="whitespace-pre-wrap text-sm">{opp.description ?? '(none)'}</pre>
      </section>

      {msg && <div className="text-sm text-blue-600">{msg}</div>}
    </div>
  );
}
