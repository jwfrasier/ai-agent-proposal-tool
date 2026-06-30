import type { ScreenResult } from '@/lib/screening/screen';

const STYLE: Record<string, { label: string; cls: string }> = {
  auto_pass: { label: 'Auto-PASS', cls: 'bg-red-100 text-red-800 border-red-200' },
  flag: { label: 'Flag — review', cls: 'bg-amber-100 text-amber-900 border-amber-200' },
  clear: { label: 'Clear', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
};

export function ScreeningPanel({ screen }: { screen: ScreenResult }) {
  const s = STYLE[screen.disposition] ?? STYLE.clear!;
  return (
    <section className="rounded border p-4 space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">Pre-screen</h2>
        <span className={`rounded border px-2 py-0.5 text-xs font-medium ${s.cls}`}>
          {s.label}
          {screen.category ? ` · ${screen.category.replace(/_/g, ' ')}` : ''}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">{screen.reason}</p>
      {screen.signals.length > 0 && (
        <ul className="space-y-1 text-sm">
          {screen.signals.map((sig, i) => (
            <li key={i} className="flex flex-wrap items-baseline gap-x-2">
              <span className="text-muted-foreground">{sig.rule}:</span>
              <code className="rounded bg-muted px-1 py-0.5 text-xs">“{sig.matched}”</code>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
