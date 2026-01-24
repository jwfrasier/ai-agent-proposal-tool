// Company Profile Types
export interface CompanyProfile {
  id: string;
  name: string;
  uei: string; // Unique Entity Identifier (replaced DUNS)
  cageCode: string;
  naicsCodes: string[];
  pscCodes: string[]; // Product Service Codes
  capabilities: string;
  pastPerformance: PastPerformance[];
  certifications: string[];
  smallBusinessTypes: string[]; // 8(a), HUBZone, WOSB, SDVOSB, etc.
  contactInfo: ContactInfo;
  coreCompetencies: string[];
  differentiators: string;
  yearsInBusiness: number;
  annualRevenue: string;
  employeeCount: number;
  hourlyRate: string;
  updatedAt: string;
}

export interface PastPerformance {
  id: string;
  contractName: string;
  agency: string;
  contractNumber: string;
  value: string;
  period: string;
  description: string;
  relevantNaics: string[];
}

export interface ContactInfo {
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  website: string;
  pointOfContact: string;
  pocTitle: string;
}

// SAM.gov Opportunity Types
export interface SamOpportunity {
  noticeId: string;
  title: string;
  solicitationNumber: string;
  department: string;
  subTier: string;
  office: string;
  postedDate: string;
  type: string;
  baseType: string;
  archiveType: string;
  archiveDate: string;
  typeOfSetAsideDescription: string;
  typeOfSetAside: string;
  responseDeadLine: string;
  naicsCode: string;
  naicsCodes: string[];
  classificationCode: string;
  active: string;
  award: Award | null;
  description: string;
  organizationType: string;
  additionalInfoLink: string;
  uiLink: string;
  resourceLinks: string[];
  officeAddress: OfficeAddress;
  placeOfPerformance: PlaceOfPerformance;
  pointOfContact: PointOfContact[];
}

export interface Award {
  date: string;
  number: string;
  amount: string;
  awardee: {
    name: string;
    location: {
      streetAddress: string;
      city: { code: string; name: string };
      state: { code: string; name: string };
      zip: string;
      country: { code: string; name: string };
    };
    ueiSAM: string;
  };
}

export interface OfficeAddress {
  zipcode: string;
  city: string;
  countryCode: string;
  state: string;
}

export interface PlaceOfPerformance {
  streetAddress?: string;
  city?: { code: string; name: string };
  state?: { code: string; name: string };
  zip?: string;
  country?: { code: string; name: string };
}

export interface PointOfContact {
  fax?: string;
  type: string;
  email: string;
  phone?: string;
  title?: string;
  fullName: string;
}

// Search Parameters
export interface SearchParams {
  keyword?: string;
  naicsCode?: string;
  typeOfSetAside?: string;
  postedFrom?: string;
  postedTo?: string;
  responseDeadlineFrom?: string;
  responseDeadlineTo?: string;
  limit?: number;
  offset?: number;
  sortBy?: string;
}

// Scoring Types
export interface OpportunityScore {
  opportunityId: string;
  overallScore: number;
  naicsMatch: number;
  capabilityMatch: number;
  pastPerformanceRelevance: number;
  setAsideEligibility: number;
  analysis: ScoreAnalysis;
  scoredAt: string;
}

export interface ScoreAnalysis {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  keyRequirements: string[];
  recommendedActions: string[];
  relevantPastPerformance: string[];
  bidNoGoBid: 'GO' | 'NO-GO' | 'CONSIDER';
  reasoning: string;
}

// Saved Contract
export interface SavedContract {
  id: string;
  opportunity: SamOpportunity;
  score?: OpportunityScore;
  notes: string;
  status: 'reviewing' | 'pursuing' | 'submitted' | 'won' | 'lost' | 'no-bid';
  savedAt: string;
  updatedAt: string;
}

// PDF Types
export type PDFType = 'capability-statement' | 'opportunity-analysis' | 'proposal-outline';

export interface PDFGenerationRequest {
  type: PDFType;
  opportunityId?: string;
  companyProfileId?: string;
}

// API Response Types
export interface SamApiResponse {
  totalRecords: number;
  limit: number;
  offset: number;
  opportunitiesData: SamOpportunity[];
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}

// Agent System Types
export interface AgentRun {
  id: string;
  status: 'selecting' | 'awaiting_approval' | 'generating' | 'completed' | 'error';
  startedAt: string;
  completedAt?: string;
  selectedOpportunities: SelectedOpportunity[];
  selectionReasoning: SelectionReasoning;
  generatedProposals?: GeneratedProposal[];
  costTracking?: CostTracking;
  error?: string;
}

export interface SelectedOpportunity {
  opportunity: SamOpportunity;
  selectionScore: number;
  factors: SelectionFactors;
  reasoning: string;
}

export interface SelectionFactors {
  aiScoreFactor: number;      // 0-100
  naicsMatchFactor: number;    // 0-100
  deadlineProximityFactor: number; // 0-100
  capabilityAlignmentFactor: number; // 0-100
  setAsideEligibilityFactor: number; // 0-100
  weightedScore: number;       // Final weighted score
}

export interface SelectionReasoning {
  totalEvaluated: number;
  searchCriteria: SearchParams;
  selectionStrategy: string;
  factorWeights: Record<string, number>;
  decisionLog: string[];
}

export interface GeneratedProposal {
  opportunityId: string;
  score: OpportunityScore;
  proposalOutline: string;
  generatedAt: string;
}

export interface CostTracking {
  selectionPhase: {
    totalTokens: number;
    promptTokens: number;
    completionTokens: number;
    estimatedCost: number;
    cachedScores: number;
    newScores: number;
  };
  proposalPhase?: {
    totalTokens: number;
    promptTokens: number;
    completionTokens: number;
    estimatedCost: number;
  };
  totalCost: number;
  totalTokens: number;
}

export interface CachedOpportunityScore {
  opportunityId: string;
  score: OpportunityScore;
  cachedAt: string;
  companyProfileId: string; // Invalidate if company profile changes
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}
