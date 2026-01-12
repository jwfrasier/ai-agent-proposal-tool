'use client';

import { cn } from '@/lib/utils';

interface ScoreDisplayProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function ScoreDisplay({ score, size = 'md', showLabel = false, className }: ScoreDisplayProps) {
  const getScoreColor = (value: number) => {
    if (value >= 80) return { bg: 'bg-emerald-100 dark:bg-emerald-950', text: 'text-emerald-600 dark:text-emerald-400', ring: 'ring-emerald-500' };
    if (value >= 60) return { bg: 'bg-amber-100 dark:bg-amber-950', text: 'text-amber-600 dark:text-amber-400', ring: 'ring-amber-500' };
    if (value >= 40) return { bg: 'bg-orange-100 dark:bg-orange-950', text: 'text-orange-600 dark:text-orange-400', ring: 'ring-orange-500' };
    return { bg: 'bg-red-100 dark:bg-red-950', text: 'text-red-600 dark:text-red-400', ring: 'ring-red-500' };
  };

  const getScoreLabel = (value: number) => {
    if (value >= 80) return 'Excellent';
    if (value >= 60) return 'Good';
    if (value >= 40) return 'Fair';
    return 'Poor';
  };

  const sizes = {
    sm: 'w-12 h-12 text-sm',
    md: 'w-16 h-16 text-lg',
    lg: 'w-24 h-24 text-2xl',
  };

  const colors = getScoreColor(score);

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <div
        className={cn(
          'rounded-full flex items-center justify-center font-bold ring-2',
          sizes[size],
          colors.bg,
          colors.text,
          colors.ring
        )}
      >
        {score}
      </div>
      {showLabel && (
        <span className={cn('text-xs font-medium', colors.text)}>
          {getScoreLabel(score)}
        </span>
      )}
    </div>
  );
}

interface ScoreBreakdownProps {
  scores: {
    label: string;
    value: number;
  }[];
}

export function ScoreBreakdown({ scores }: ScoreBreakdownProps) {
  const getBarColor = (value: number) => {
    if (value >= 80) return 'bg-emerald-500';
    if (value >= 60) return 'bg-amber-500';
    if (value >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-3">
      {scores.map((item) => (
        <div key={item.label} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{item.label}</span>
            <span className="font-medium">{item.value}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-500', getBarColor(item.value))}
              style={{ width: `${item.value}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
