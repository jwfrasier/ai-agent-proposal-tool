import type { AgentRun, SearchParams, SamOpportunity, CompanyProfile, GeneratedProposal, CostTracking, TokenUsage } from '@/types';
import { OpportunitySelector } from './opportunity-selector';
import { AgentLogger } from './agent-logger';
import { getCompanyProfile, getCachedSearch } from '@/lib/storage';
import { scoreOpportunityWithTokens, generateProposalOutlineWithTokens } from '@/lib/openai';
import { searchOpportunities } from '@/lib/sam-api';

// GPT-4o-mini pricing (as of 2024)
const COST_PER_1M_PROMPT_TOKENS = 0.15; // $0.15 per 1M tokens
const COST_PER_1M_COMPLETION_TOKENS = 0.60; // $0.60 per 1M tokens

function calculateCost(tokenUsage: TokenUsage): number {
  const promptCost = (tokenUsage.promptTokens / 1_000_000) * COST_PER_1M_PROMPT_TOKENS;
  const completionCost = (tokenUsage.completionTokens / 1_000_000) * COST_PER_1M_COMPLETION_TOKENS;
  return promptCost + completionCost;
}

function generateId(): string {
  return `agent-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export class AgentOrchestrator {
  private logger: AgentLogger;

  constructor() {
    this.logger = new AgentLogger();
  }

  async runAgent(searchParams?: SearchParams): Promise<AgentRun> {
    const runId = generateId();
    this.logger.log('Starting agent run', { runId, searchParams });
    
    const run: AgentRun = {
      id: runId,
      status: 'selecting',
      startedAt: new Date().toISOString(),
      selectedOpportunities: [],
      selectionReasoning: {
        totalEvaluated: 0,
        searchCriteria: searchParams || {},
        selectionStrategy: '',
        factorWeights: {},
        decisionLog: [],
      },
    };

    try {
      // Step 1: Fetch company profile
      this.logger.log('Fetching company profile');
      const companyProfile = await getCompanyProfile();
      
      if (!companyProfile) {
        throw new Error('Company profile not found. Please set up your company profile first.');
      }

      // Step 2: Fetch opportunities (from cache or SAM.gov)
      this.logger.log('Fetching opportunities', { searchParams });
      const opportunities = await this.fetchOpportunities(searchParams);
      
      if (opportunities.length === 0) {
        throw new Error('No opportunities found matching the search criteria.');
      }
      
      this.logger.log(`Found ${opportunities.length} opportunities to evaluate`);
      
      // Step 3: Select best 5 using multi-factor analysis
      this.logger.log('Starting multi-factor opportunity selection');
      const selector = new OpportunitySelector(companyProfile);
      const selectionResult = await selector.selectBestOpportunities(opportunities, 5);
      
      this.logger.log(`Selected ${selectionResult.selected.length} top opportunities`);
      this.logger.log(`Token usage - Prompt: ${selectionResult.tokenUsage.promptTokens}, Completion: ${selectionResult.tokenUsage.completionTokens}, Total: ${selectionResult.tokenUsage.totalTokens}`);
      this.logger.log(`Cached scores used: ${selectionResult.cachedScores}, New scores: ${selectionResult.newScores}`);
      
      // Step 4: Calculate costs
      const selectionCost = calculateCost(selectionResult.tokenUsage);
      this.logger.log(`Selection phase cost: $${selectionCost.toFixed(4)}`);
      
      const costTracking: CostTracking = {
        selectionPhase: {
          totalTokens: selectionResult.tokenUsage.totalTokens,
          promptTokens: selectionResult.tokenUsage.promptTokens,
          completionTokens: selectionResult.tokenUsage.completionTokens,
          estimatedCost: selectionCost,
          cachedScores: selectionResult.cachedScores,
          newScores: selectionResult.newScores,
        },
        totalCost: selectionCost,
        totalTokens: selectionResult.tokenUsage.totalTokens,
      };
      
      // Step 5: Generate selection reasoning
      const selectionReasoning = this.logger.generateSelectionReasoning(
        opportunities,
        selectionResult.selected,
        searchParams || {},
        selector.getFactorWeights()
      );
      
      // Step 6: Update run status
      run.selectedOpportunities = selectionResult.selected;
      run.selectionReasoning = selectionReasoning;
      run.costTracking = costTracking;
      run.status = 'awaiting_approval';
      
      this.logger.log('Agent selection complete, awaiting user approval');
      
      return run;
    } catch (error) {
      this.logger.log('Agent run failed', { error });
      run.status = 'error';
      run.error = error instanceof Error ? error.message : 'Unknown error occurred';
      run.selectionReasoning.decisionLog = this.logger.getLogs();
      throw error;
    }
  }

  async generateProposals(run: AgentRun): Promise<AgentRun> {
    this.logger.clearLogs();
    this.logger.log('Starting proposal generation', { runId: run.id });
    
    try {
      run.status = 'generating';
      
      // Fetch company profile
      const companyProfile = await getCompanyProfile();
      if (!companyProfile) {
        throw new Error('Company profile not found');
      }

      const generatedProposals: GeneratedProposal[] = [];
      let proposalTokenUsage: TokenUsage = {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      };
      
      // Step 1: Score and generate proposals for each selected opportunity
      for (let i = 0; i < run.selectedOpportunities.length; i++) {
        const selectedOpp = run.selectedOpportunities[i];
        const opp = selectedOpp.opportunity;
        
        this.logger.log(`Processing opportunity ${i + 1}/${run.selectedOpportunities.length}: ${opp.title}`);
        
        try {
          // Get detailed AI score
          this.logger.log(`Scoring opportunity: ${opp.noticeId}`);
          const scoreResult = await scoreOpportunityWithTokens(opp, companyProfile);
          
          // Track tokens
          proposalTokenUsage.promptTokens += scoreResult.tokenUsage.promptTokens;
          proposalTokenUsage.completionTokens += scoreResult.tokenUsage.completionTokens;
          proposalTokenUsage.totalTokens += scoreResult.tokenUsage.totalTokens;
          
          // Generate proposal outline
          this.logger.log(`Generating proposal outline for: ${opp.noticeId}`);
          const proposalResult = await generateProposalOutlineWithTokens(opp, companyProfile, scoreResult.score);
          
          // Track tokens
          proposalTokenUsage.promptTokens += proposalResult.tokenUsage.promptTokens;
          proposalTokenUsage.completionTokens += proposalResult.tokenUsage.completionTokens;
          proposalTokenUsage.totalTokens += proposalResult.tokenUsage.totalTokens;
          
          generatedProposals.push({
            opportunityId: opp.noticeId,
            score: scoreResult.score,
            proposalOutline: proposalResult.outline,
            generatedAt: new Date().toISOString(),
          });
          
          this.logger.log(`Successfully generated proposal for: ${opp.noticeId}`);
        } catch (error) {
          this.logger.log(`Failed to generate proposal for ${opp.noticeId}`, { error });
          // Continue with other opportunities
        }
      }
      
      // Step 2: Calculate proposal phase costs
      const proposalCost = calculateCost(proposalTokenUsage);
      this.logger.log(`Proposal phase - Tokens: ${proposalTokenUsage.totalTokens}, Cost: $${proposalCost.toFixed(4)}`);
      
      // Update cost tracking
      if (run.costTracking) {
        run.costTracking.proposalPhase = {
          totalTokens: proposalTokenUsage.totalTokens,
          promptTokens: proposalTokenUsage.promptTokens,
          completionTokens: proposalTokenUsage.completionTokens,
          estimatedCost: proposalCost,
        };
        run.costTracking.totalCost += proposalCost;
        run.costTracking.totalTokens += proposalTokenUsage.totalTokens;
        
        this.logger.log(`Total cost for entire agent run: $${run.costTracking.totalCost.toFixed(4)}`);
      }
      
      // Step 3: Update run with generated proposals
      run.generatedProposals = generatedProposals;
      run.status = 'completed';
      run.completedAt = new Date().toISOString();
      
      // Update decision log
      run.selectionReasoning.decisionLog = [
        ...run.selectionReasoning.decisionLog,
        ...this.logger.getLogs()
      ];
      
      this.logger.log(`Proposal generation complete. Generated ${generatedProposals.length} proposals.`);
      
      return run;
    } catch (error) {
      this.logger.log('Proposal generation failed', { error });
      run.status = 'error';
      run.error = error instanceof Error ? error.message : 'Unknown error during proposal generation';
      run.selectionReasoning.decisionLog = [
        ...run.selectionReasoning.decisionLog,
        ...this.logger.getLogs()
      ];
      throw error;
    }
  }

  private async fetchOpportunities(searchParams?: SearchParams): Promise<SamOpportunity[]> {
    // Build default search params if none provided
    const params: SearchParams = {
      keyword: 'software development',
      limit: 15, // Get a pool to select from
      offset: 0,
      ...searchParams,
    };
    
    // Try to get from cache first
    const cacheKey = this.buildCacheKey(params);
    const cached = await getCachedSearch(cacheKey);
    
    if (cached && cached.opportunitiesData) {
      this.logger.log('Using cached opportunities', { count: cached.opportunitiesData.length });
      return cached.opportunitiesData;
    }
    
    // Fetch from SAM.gov API
    try {
      this.logger.log('Fetching from SAM.gov API');
      const response = await searchOpportunities(params);
      
      if (response.opportunitiesData && response.opportunitiesData.length > 0) {
        this.logger.log('Fetched opportunities from SAM.gov', { count: response.opportunitiesData.length });
        return response.opportunitiesData;
      }
      
      return [];
    } catch (error) {
      this.logger.log('Failed to fetch from SAM.gov', { error });
      throw new Error('Failed to fetch opportunities from SAM.gov');
    }
  }

  private buildCacheKey(params: SearchParams): string {
    const parts = [
      params.keyword || '',
      params.naicsCode || '',
      params.typeOfSetAside || '',
      params.postedFrom || '',
      params.postedTo || '',
      params.limit?.toString() || '',
      params.offset?.toString() || '',
    ];
    return parts.join('|');
  }
}
