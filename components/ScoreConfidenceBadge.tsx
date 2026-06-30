export function ScoreConfidenceBadge({
  confidence,
  confidenceReason,
  ambiguity,
}: {
  confidence: number | null;
  confidenceReason: string | null;
  ambiguity: string | null;
}) {
  if (confidence == null) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <span className="inline-block h-2 w-2 rounded-full bg-gray-300" />
        no confidence data
      </span>
    );
  }

  const pct = Math.round(confidence * 100);
  const dotColor =
    confidence >= 0.8
      ? 'bg-green-500'
      : confidence >= 0.5
        ? 'bg-amber-500'
        : 'bg-red-500';

  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span
        className={`inline-block h-2 w-2 rounded-full ${dotColor}`}
        title={confidenceReason ?? undefined}
      />
      <span title={confidenceReason ?? undefined}>{pct}% confident</span>
      {ambiguity && ambiguity !== 'none' && (
        <span className="rounded bg-muted px-1.5 py-0.5 text-muted-foreground font-medium capitalize">
          {ambiguity.replace(/_/g, ' ')}
        </span>
      )}
    </span>
  );
}
