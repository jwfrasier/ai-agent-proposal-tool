import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { SelectedOpportunity } from '@/types';
import { Building2, Calendar, FileText, TrendingUp, Award } from 'lucide-react';

interface AgentReasoningCardProps {
  selectedOpportunity: SelectedOpportunity;
  index: number;
}

export function AgentReasoningCard({ selectedOpportunity, index }: AgentReasoningCardProps) {
  const { opportunity, selectionScore, factors, reasoning } = selectedOpportunity;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-blue-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-950 border-emerald-700';
    if (score >= 60) return 'bg-blue-950 border-blue-700';
    if (score >= 40) return 'bg-yellow-950 border-yellow-700';
    return 'bg-orange-950 border-orange-700';
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700/50">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="bg-blue-950 border-blue-700 text-blue-400">
                #{index + 1}
              </Badge>
              <Badge 
                variant="outline" 
                className={`${getScoreBgColor(selectionScore)} ${getScoreColor(selectionScore)}`}
              >
                <TrendingUp className="h-3 w-3 mr-1" />
                Score: {selectionScore}/100
              </Badge>
            </div>
            <CardTitle className="text-xl text-slate-100">
              {opportunity.title}
            </CardTitle>
            <CardDescription className="mt-2 flex flex-wrap gap-3 text-slate-400">
              <span className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {opportunity.department}
              </span>
              {opportunity.naicsCode && (
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  NAICS: {opportunity.naicsCode}
                </span>
              )}
              {opportunity.responseDeadLine && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Due: {new Date(opportunity.responseDeadLine).toLocaleDateString()}
                </span>
              )}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Selection Factors */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-300">Selection Factor Breakdown</h4>
          
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">AI Compatibility</span>
                <span className={getScoreColor(factors.aiScoreFactor)}>
                  {factors.aiScoreFactor}/100
                </span>
              </div>
              <Progress value={factors.aiScoreFactor} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">NAICS Match</span>
                <span className={getScoreColor(factors.naicsMatchFactor)}>
                  {factors.naicsMatchFactor}/100
                </span>
              </div>
              <Progress value={factors.naicsMatchFactor} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Deadline Proximity</span>
                <span className={getScoreColor(factors.deadlineProximityFactor)}>
                  {factors.deadlineProximityFactor}/100
                </span>
              </div>
              <Progress value={factors.deadlineProximityFactor} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Capability Alignment</span>
                <span className={getScoreColor(factors.capabilityAlignmentFactor)}>
                  {factors.capabilityAlignmentFactor}/100
                </span>
              </div>
              <Progress value={factors.capabilityAlignmentFactor} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Set-Aside Eligibility</span>
                <span className={getScoreColor(factors.setAsideEligibilityFactor)}>
                  {factors.setAsideEligibilityFactor}/100
                </span>
              </div>
              <Progress value={factors.setAsideEligibilityFactor} className="h-2" />
            </div>
          </div>
        </div>

        {/* Agent Reasoning */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <Award className="h-4 w-4 text-blue-400" />
            Agent Reasoning
          </h4>
          <p className="text-sm text-slate-400 leading-relaxed">
            {reasoning}
          </p>
        </div>

        {/* Set-Aside Info */}
        {opportunity.typeOfSetAsideDescription && (
          <div className="pt-2 border-t border-slate-700">
            <span className="text-xs text-slate-500">Set-Aside: </span>
            <span className="text-xs text-slate-400">{opportunity.typeOfSetAsideDescription}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
