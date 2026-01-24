import type { CompanyProfile, SamOpportunity, SelectedOpportunity, SelectionFactors, TokenUsage } from '@/types';
import { scoreOpportunityWithTokens } from '@/lib/openai';
import { getCachedScore, setCachedScore } from '@/lib/storage';

export class OpportunitySelector {
  private companyProfile: CompanyProfile;
  private factorWeights = {
    aiScore: 0.30,
    naicsMatch: 0.25,
    deadlineProximity: 0.15,
    capabilityAlignment: 0.20,
    setAsideEligibility: 0.10,
  };
  private totalTokenUsage: TokenUsage = {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
  };
  private cachedScoresUsed: number = 0;
  private newScoresGenerated: number = 0;

  constructor(companyProfile: CompanyProfile) {
    this.companyProfile = companyProfile;
  }

  async selectBestOpportunities(
    opportunities: SamOpportunity[],
    limit: number = 5
  ): Promise<{
    selected: SelectedOpportunity[];
    tokenUsage: TokenUsage;
    cachedScores: number;
    newScores: number;
  }> {
    console.log(`Starting selection from ${opportunities.length} opportunities`);
    
    // Reset counters
    this.totalTokenUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
    this.cachedScoresUsed = 0;
    this.newScoresGenerated = 0;
    
    // Score all opportunities with multiple factors
    const scoredOpportunities: SelectedOpportunity[] = [];
    
    for (const opp of opportunities) {
      try {
        // Calculate all factors
        const factors = await this.calculateAllFactors(opp);
        
        // Generate reasoning for this selection
        const reasoning = this.generateReasoning(opp, factors);
        
        scoredOpportunities.push({
          opportunity: opp,
          selectionScore: factors.weightedScore,
          factors,
          reasoning,
        });
      } catch (error) {
        console.error(`Error scoring opportunity ${opp.noticeId}:`, error);
        // Continue with next opportunity
      }
    }
    
    // Sort by weighted score and take top N
    scoredOpportunities.sort((a, b) => b.selectionScore - a.selectionScore);
    
    const selected = scoredOpportunities.slice(0, limit);
    console.log(`Selected top ${selected.length} opportunities`);
    console.log(`Used ${this.cachedScoresUsed} cached scores, generated ${this.newScoresGenerated} new scores`);
    console.log(`Total tokens used: ${this.totalTokenUsage.totalTokens}`);
    
    return {
      selected,
      tokenUsage: this.totalTokenUsage,
      cachedScores: this.cachedScoresUsed,
      newScores: this.newScoresGenerated,
    };
  }

  private async calculateAllFactors(opp: SamOpportunity): Promise<SelectionFactors> {
    // Calculate each factor
    const naicsMatchFactor = this.calculateNaicsMatch(opp);
    const deadlineProximityFactor = this.calculateDeadlineProximity(opp);
    const capabilityAlignmentFactor = this.calculateCapabilityAlignment(opp);
    const setAsideEligibilityFactor = this.calculateSetAsideEligibility(opp);
    
    // Get AI score - check cache first
    let aiScoreFactor = 50; // Default if AI scoring fails
    try {
      // Try to get cached score
      const cachedScore = await getCachedScore(opp.noticeId, this.companyProfile.id);
      
      if (cachedScore) {
        // Use cached score
        aiScoreFactor = cachedScore.overallScore;
        this.cachedScoresUsed++;
        console.log(`Using cached score for ${opp.noticeId}`);
      } else {
        // Generate new score
        const result = await scoreOpportunityWithTokens(opp, this.companyProfile);
        aiScoreFactor = result.score.overallScore;
        
        // Track token usage
        this.totalTokenUsage.promptTokens += result.tokenUsage.promptTokens;
        this.totalTokenUsage.completionTokens += result.tokenUsage.completionTokens;
        this.totalTokenUsage.totalTokens += result.tokenUsage.totalTokens;
        this.newScoresGenerated++;
        
        // Cache the score for future use
        await setCachedScore(opp.noticeId, result.score, this.companyProfile.id);
        console.log(`Generated and cached new score for ${opp.noticeId}`);
      }
    } catch (error) {
      console.error(`AI scoring failed for ${opp.noticeId}, using default score`);
    }
    
    // Calculate weighted score
    const weightedScore = 
      (aiScoreFactor * this.factorWeights.aiScore) +
      (naicsMatchFactor * this.factorWeights.naicsMatch) +
      (deadlineProximityFactor * this.factorWeights.deadlineProximity) +
      (capabilityAlignmentFactor * this.factorWeights.capabilityAlignment) +
      (setAsideEligibilityFactor * this.factorWeights.setAsideEligibility);
    
    return {
      aiScoreFactor,
      naicsMatchFactor,
      deadlineProximityFactor,
      capabilityAlignmentFactor,
      setAsideEligibilityFactor,
      weightedScore: Math.round(weightedScore),
    };
  }

  private calculateNaicsMatch(opp: SamOpportunity): number {
    const oppNaics = opp.naicsCode || '';
    const companyNaics = this.companyProfile.naicsCodes || [];
    
    // Exact match
    if (companyNaics.includes(oppNaics)) {
      return 100;
    }
    
    // Check if same industry (first 2 digits)
    const oppPrefix = oppNaics.substring(0, 2);
    const relatedMatch = companyNaics.some(cn => cn.substring(0, 2) === oppPrefix);
    if (relatedMatch) {
      return 70;
    }
    
    // No match
    return 30;
  }

  private calculateDeadlineProximity(opp: SamOpportunity): number {
    if (!opp.responseDeadLine) {
      return 50; // Unknown deadline
    }
    
    try {
      const deadline = new Date(opp.responseDeadLine);
      const now = new Date();
      const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilDeadline < 0) {
        return 0; // Past deadline
      } else if (daysUntilDeadline < 7) {
        return 30; // Too soon, not enough time
      } else if (daysUntilDeadline >= 30 && daysUntilDeadline <= 45) {
        return 100; // Optimal window
      } else if (daysUntilDeadline >= 20 && daysUntilDeadline < 30) {
        return 90; // Good window
      } else if (daysUntilDeadline >= 45 && daysUntilDeadline <= 60) {
        return 85; // Still good
      } else if (daysUntilDeadline > 60) {
        return 60; // Too far out, priorities may change
      } else {
        return 50; // 7-20 days, tight but doable
      }
    } catch (error) {
      return 50; // Error parsing date
    }
  }

  private calculateCapabilityAlignment(opp: SamOpportunity): number {
    const description = (opp.description || '').toLowerCase();
    const title = (opp.title || '').toLowerCase();
    const combinedText = `${title} ${description}`;
    
    // Define capability keywords from company profile
    const capabilityKeywords = [
      'software', 'development', 'web', 'application', 'react', 'next.js', 'nextjs',
      'node', 'nodejs', 'python', 'javascript', 'typescript', 'microservices',
      'api', 'cloud', 'aws', 'azure', 'salesforce', 'integration', 'ai', 'llm',
      'machine learning', 'data', 'analytics', 'unix', 'linux', 'devops',
      'agile', 'modern', 'enterprise', 'custom', 'consulting'
    ];
    
    // Count matching keywords
    let matchCount = 0;
    for (const keyword of capabilityKeywords) {
      if (combinedText.includes(keyword)) {
        matchCount++;
      }
    }
    
    // Calculate score based on match percentage
    const matchPercentage = (matchCount / capabilityKeywords.length) * 100;
    
    // Scale to 0-100 with a more generous curve
    if (matchPercentage >= 20) return 100;
    if (matchPercentage >= 15) return 90;
    if (matchPercentage >= 10) return 80;
    if (matchPercentage >= 7) return 70;
    if (matchPercentage >= 5) return 60;
    if (matchPercentage >= 3) return 50;
    return 30;
  }

  private calculateSetAsideEligibility(opp: SamOpportunity): number {
    const setAside = (opp.typeOfSetAsideDescription || '').toLowerCase();
    const companyTypes = (this.companyProfile.smallBusinessTypes || []).map(t => t.toLowerCase());
    
    // If no set-aside (full and open), anyone can bid
    if (!setAside || setAside.includes('none') || setAside.includes('full and open')) {
      return 80; // Good but not perfect (may face larger competitors)
    }
    
    // Check if company qualifies for the set-aside
    if (setAside.includes('small business')) {
      // Most small businesses qualify
      return 90;
    }
    
    // Check specific set-asides
    if (setAside.includes('8(a)') && companyTypes.includes('8(a)')) return 100;
    if (setAside.includes('hubzone') && companyTypes.includes('hubzone')) return 100;
    if (setAside.includes('wosb') && companyTypes.includes('wosb')) return 100;
    if (setAside.includes('sdvosb') && companyTypes.includes('sdvosb')) return 100;
    if (setAside.includes('vosb') && companyTypes.includes('vosb')) return 100;
    
    // Set-aside exists but company doesn't qualify
    return 20;
  }

  private generateReasoning(opp: SamOpportunity, factors: SelectionFactors): string {
    const reasons: string[] = [];
    
    // AI Score reasoning
    if (factors.aiScoreFactor >= 80) {
      reasons.push(`Excellent AI compatibility score of ${factors.aiScoreFactor}/100 indicates strong alignment with company capabilities.`);
    } else if (factors.aiScoreFactor >= 60) {
      reasons.push(`Good AI compatibility score of ${factors.aiScoreFactor}/100 suggests viable opportunity.`);
    } else {
      reasons.push(`Moderate AI score of ${factors.aiScoreFactor}/100, but other factors are favorable.`);
    }
    
    // NAICS reasoning
    if (factors.naicsMatchFactor === 100) {
      reasons.push(`Perfect NAICS code match (${opp.naicsCode}) with company registration.`);
    } else if (factors.naicsMatchFactor >= 70) {
      reasons.push(`Related NAICS code (${opp.naicsCode}) in same industry sector.`);
    }
    
    // Deadline reasoning
    if (factors.deadlineProximityFactor >= 85) {
      reasons.push(`Optimal response deadline provides sufficient preparation time.`);
    } else if (factors.deadlineProximityFactor >= 50) {
      reasons.push(`Response deadline is workable with focused effort.`);
    } else {
      reasons.push(`Tight deadline but other factors justify consideration.`);
    }
    
    // Capability reasoning
    if (factors.capabilityAlignmentFactor >= 80) {
      reasons.push(`Strong keyword alignment indicates technical requirements match company expertise.`);
    } else if (factors.capabilityAlignmentFactor >= 60) {
      reasons.push(`Good technical alignment with company capabilities.`);
    }
    
    // Set-aside reasoning
    if (factors.setAsideEligibilityFactor === 100) {
      reasons.push(`Company qualifies for specific set-aside designation, reducing competition.`);
    } else if (factors.setAsideEligibilityFactor >= 80) {
      reasons.push(`Company is eligible to compete for this opportunity.`);
    }
    
    // Overall conclusion
    reasons.push(`Overall weighted selection score: ${factors.weightedScore}/100.`);
    
    return reasons.join(' ');
  }

  getFactorWeights() {
    return { ...this.factorWeights };
  }
}
