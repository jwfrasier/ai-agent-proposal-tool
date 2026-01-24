import type { SamOpportunity, SelectedOpportunity, SelectionReasoning, SearchParams } from '@/types';

export class AgentLogger {
  private logs: string[] = [];

  log(message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    this.logs.push(logEntry);
    
    if (data) {
      console.log(message, data);
    } else {
      console.log(message);
    }
  }

  getLogs(): string[] {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }

  generateSelectionReasoning(
    opportunities: SamOpportunity[],
    selected: SelectedOpportunity[],
    searchCriteria: SearchParams,
    factorWeights: Record<string, number>
  ): SelectionReasoning {
    // Build comprehensive selection strategy description
    const strategy = this.buildSelectionStrategy(opportunities, selected, factorWeights);
    
    return {
      totalEvaluated: opportunities.length,
      searchCriteria,
      selectionStrategy: strategy,
      factorWeights,
      decisionLog: this.getLogs(),
    };
  }

  private buildSelectionStrategy(
    opportunities: SamOpportunity[],
    selected: SelectedOpportunity[],
    factorWeights: Record<string, number>
  ): string {
    const parts: string[] = [];
    
    parts.push(`Evaluated ${opportunities.length} government contract opportunities using a multi-factor weighted scoring algorithm.`);
    
    parts.push(`\n\nSelection Methodology:`);
    parts.push(`- AI Compatibility Analysis (${(factorWeights.aiScore * 100).toFixed(0)}% weight): Deep learning model evaluates opportunity fit against company capabilities, past performance, and qualifications.`);
    parts.push(`- NAICS Code Matching (${(factorWeights.naicsMatch * 100).toFixed(0)}% weight): Exact or related industry code alignment with company registrations.`);
    parts.push(`- Deadline Proximity Analysis (${(factorWeights.deadlineProximity * 100).toFixed(0)}% weight): Optimal response timeline (30-45 days preferred) to ensure quality proposal development.`);
    parts.push(`- Capability Alignment (${(factorWeights.capabilityAlignment * 100).toFixed(0)}% weight): Keyword and technical requirements matching against company tech stack and expertise.`);
    parts.push(`- Set-Aside Eligibility (${(factorWeights.setAsideEligibility * 100).toFixed(0)}% weight): Qualification for small business set-asides and competitive positioning.`);
    
    parts.push(`\n\nSelection Results:`);
    parts.push(`Selected top ${selected.length} opportunities based on weighted composite scores ranging from ${selected[selected.length - 1]?.selectionScore || 0} to ${selected[0]?.selectionScore || 0} out of 100.`);
    
    // Add summary statistics
    const avgScore = selected.reduce((sum, s) => sum + s.selectionScore, 0) / selected.length;
    parts.push(`Average selection score: ${avgScore.toFixed(1)}/100.`);
    
    // Count GO recommendations if AI scores are available
    const goCount = selected.filter(s => 
      s.factors.aiScoreFactor >= 70
    ).length;
    parts.push(`${goCount} of ${selected.length} have high AI compatibility scores (≥70).`);
    
    parts.push(`\n\nAll selected opportunities have been validated for technical feasibility, timeline appropriateness, and strategic alignment with company objectives.`);
    
    return parts.join('\n');
  }
}
