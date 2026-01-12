'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Building2,
  MapPin,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Sparkles,
} from 'lucide-react';
import type { SamOpportunity, OpportunityScore } from '@/types';
import { ScoreDisplay } from './ScoreDisplay';

interface ContractCardProps {
  opportunity: SamOpportunity;
  score?: OpportunityScore;
  isSaved?: boolean;
  onSave?: () => void;
  onScore?: () => void;
  onView?: () => void;
  scoring?: boolean;
}

export function ContractCard({
  opportunity,
  score,
  isSaved,
  onSave,
  onScore,
  onView,
  scoring,
}: ContractCardProps) {
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const isDeadlineSoon = (dateStr: string | null | undefined) => {
    if (!dateStr) return false;
    try {
      const deadline = new Date(dateStr);
      const now = new Date();
      const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntil <= 7 && daysUntil > 0;
    } catch {
      return false;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'solicitation':
      case 'o':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
      case 'presolicitation':
      case 'p':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
      case 'combined':
      case 'k':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200';
    }
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 hover:border-primary/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={getTypeColor(opportunity.type)}>
                {opportunity.type || 'Opportunity'}
              </Badge>
              {opportunity.typeOfSetAsideDescription && (
                <Badge variant="secondary" className="text-xs">
                  {opportunity.typeOfSetAsideDescription}
                </Badge>
              )}
              {opportunity.naicsCode && (
                <Badge variant="outline" className="text-xs font-mono">
                  NAICS: {opportunity.naicsCode}
                </Badge>
              )}
              {isDeadlineSoon(opportunity.responseDeadLine) && (
                <Badge variant="destructive" className="text-xs animate-pulse">
                  Deadline Soon!
                </Badge>
              )}
            </div>
            <h3
              className="font-semibold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors cursor-pointer"
              onClick={onView}
            >
              {opportunity.title}
            </h3>
            {opportunity.solicitationNumber && (
              <p className="text-sm text-muted-foreground font-mono">
                {opportunity.solicitationNumber}
              </p>
            )}
          </div>
          {score && <ScoreDisplay score={score.overallScore} size="sm" />}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Building2 className="h-4 w-4 flex-shrink-0" />
            <span className="line-clamp-1">
              {opportunity.department}
              {opportunity.subTier && ` - ${opportunity.subTier}`}
            </span>
          </div>
          {(opportunity.placeOfPerformance?.city?.name ||
            opportunity.placeOfPerformance?.state?.name) && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span>
                {opportunity.placeOfPerformance.city?.name}
                {opportunity.placeOfPerformance.city?.name &&
                  opportunity.placeOfPerformance.state?.name &&
                  ', '}
                {opportunity.placeOfPerformance.state?.name}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <span>
              Posted: {formatDate(opportunity.postedDate)}
              {opportunity.responseDeadLine && (
                <>
                  {' '}
                  • Due:{' '}
                  <span
                    className={
                      isDeadlineSoon(opportunity.responseDeadLine)
                        ? 'text-destructive font-medium'
                        : ''
                    }
                  >
                    {formatDate(opportunity.responseDeadLine)}
                  </span>
                </>
              )}
            </span>
          </div>
        </div>

        {opportunity.description && (
          <p className="text-sm text-muted-foreground line-clamp-3">{opportunity.description}</p>
        )}

        {/* Score Analysis Summary */}
        {score && (
          <div className="p-3 bg-muted/50 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  score.analysis.bidNoGoBid === 'GO'
                    ? 'default'
                    : score.analysis.bidNoGoBid === 'NO-GO'
                      ? 'destructive'
                      : 'secondary'
                }
              >
                {score.analysis.bidNoGoBid}
              </Badge>
              <span className="text-sm font-medium">{score.analysis.summary}</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onView}>
              View Details
            </Button>
            {opportunity.uiLink && (
              <Button variant="ghost" size="sm" asChild>
                <a href={opportunity.uiLink} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  SAM.gov
                </a>
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {onScore && (
              <Button
                variant="outline"
                size="sm"
                onClick={onScore}
                disabled={scoring}
                className="gap-1"
              >
                <Sparkles className="h-4 w-4" />
                {scoring ? 'Scoring...' : score ? 'Re-Score' : 'AI Score'}
              </Button>
            )}
            {onSave && (
              <Button
                variant={isSaved ? 'default' : 'outline'}
                size="sm"
                onClick={onSave}
                className="gap-1"
              >
                {isSaved ? (
                  <BookmarkCheck className="h-4 w-4" />
                ) : (
                  <Bookmark className="h-4 w-4" />
                )}
                {isSaved ? 'Saved' : 'Save'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
