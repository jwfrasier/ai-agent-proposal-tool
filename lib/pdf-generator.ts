import type { CompanyProfile, SamOpportunity, OpportunityScore } from '@/types';

// PDF content generators that return structured data for the PDF templates

export interface CapabilityStatementData {
  company: CompanyProfile;
  generatedAt: string;
}

export interface OpportunityAnalysisData {
  opportunity: SamOpportunity;
  score: OpportunityScore;
  company: CompanyProfile;
  generatedAt: string;
}

export interface ProposalOutlineData {
  opportunity: SamOpportunity;
  score: OpportunityScore;
  company: CompanyProfile;
  outline: string;
  generatedAt: string;
}

export function generateCapabilityStatementData(company: CompanyProfile): CapabilityStatementData {
  return {
    company,
    generatedAt: new Date().toISOString(),
  };
}

export function generateOpportunityAnalysisData(
  opportunity: SamOpportunity,
  score: OpportunityScore,
  company: CompanyProfile
): OpportunityAnalysisData {
  return {
    opportunity,
    score,
    company,
    generatedAt: new Date().toISOString(),
  };
}

export function generateProposalOutlineData(
  opportunity: SamOpportunity,
  score: OpportunityScore,
  company: CompanyProfile,
  outline: string
): ProposalOutlineData {
  return {
    opportunity,
    score,
    company,
    outline,
    generatedAt: new Date().toISOString(),
  };
}

// Format helpers
export function formatDate(dateString: string): string {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function formatCurrency(value: string | number): string {
  if (!value) return 'N/A';
  const num = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]+/g, '')) : value;
  if (isNaN(num)) return String(value);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function getScoreColor(score: number): string {
  if (score >= 80) return '#22c55e'; // green
  if (score >= 60) return '#eab308'; // yellow
  if (score >= 40) return '#f97316'; // orange
  return '#ef4444'; // red
}

export function getBidDecisionColor(decision: 'GO' | 'NO-GO' | 'CONSIDER'): string {
  switch (decision) {
    case 'GO': return '#22c55e';
    case 'NO-GO': return '#ef4444';
    case 'CONSIDER': return '#eab308';
    default: return '#6b7280';
  }
}
