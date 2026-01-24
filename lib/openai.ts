import OpenAI from 'openai';
import type { CompanyProfile, SamOpportunity, OpportunityScore, ScoreAnalysis, TokenUsage } from '@/types';

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }
  return new OpenAI({ apiKey });
}

export async function scoreOpportunity(
  opportunity: SamOpportunity,
  companyProfile: CompanyProfile
): Promise<OpportunityScore> {
  const result = await scoreOpportunityWithTokens(opportunity, companyProfile);
  return result.score;
}

export async function scoreOpportunityWithTokens(
  opportunity: SamOpportunity,
  companyProfile: CompanyProfile
): Promise<{ score: OpportunityScore; tokenUsage: TokenUsage }> {
  const prompt = buildScoringPrompt(opportunity, companyProfile);
  const openai = getOpenAIClient();
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a government contracting expert analyst. Your job is to evaluate federal contract opportunities against a company's capabilities and provide a detailed scoring and analysis.

You must respond with valid JSON only, no markdown formatting. The JSON should match this structure:
{
  "overallScore": number (0-100),
  "naicsMatch": number (0-100),
  "capabilityMatch": number (0-100),
  "pastPerformanceRelevance": number (0-100),
  "setAsideEligibility": number (0-100),
  "analysis": {
    "summary": "2-3 sentence executive summary",
    "strengths": ["strength 1", "strength 2", ...],
    "weaknesses": ["weakness 1", "weakness 2", ...],
    "keyRequirements": ["requirement 1", "requirement 2", ...],
    "recommendedActions": ["action 1", "action 2", ...],
    "relevantPastPerformance": ["relevant project 1", ...],
    "bidNoGoBid": "GO" | "NO-GO" | "CONSIDER",
    "reasoning": "Detailed explanation of the bid/no-bid recommendation"
  }
}`
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.3,
    max_tokens: 2000,
  });
  
  const content = response.choices[0]?.message?.content;
  
  if (!content) {
    throw new Error('No response from OpenAI');
  }
  
  // Parse the JSON response
  const parsed = JSON.parse(content);
  
  const score: OpportunityScore = {
    opportunityId: opportunity.noticeId,
    overallScore: parsed.overallScore,
    naicsMatch: parsed.naicsMatch,
    capabilityMatch: parsed.capabilityMatch,
    pastPerformanceRelevance: parsed.pastPerformanceRelevance,
    setAsideEligibility: parsed.setAsideEligibility,
    analysis: parsed.analysis as ScoreAnalysis,
    scoredAt: new Date().toISOString(),
  };
  
  const tokenUsage: TokenUsage = {
    promptTokens: response.usage?.prompt_tokens || 0,
    completionTokens: response.usage?.completion_tokens || 0,
    totalTokens: response.usage?.total_tokens || 0,
  };
  
  return { score, tokenUsage };
}

function buildScoringPrompt(opportunity: SamOpportunity, company: CompanyProfile): string {
  return `
## OPPORTUNITY DETAILS

**Title:** ${opportunity.title}
**Solicitation Number:** ${opportunity.solicitationNumber || 'N/A'}
**Agency:** ${opportunity.department} - ${opportunity.subTier || ''} - ${opportunity.office || ''}
**NAICS Code:** ${opportunity.naicsCode || 'N/A'}
**Set-Aside:** ${opportunity.typeOfSetAsideDescription || 'None'}
**Response Deadline:** ${opportunity.responseDeadLine || 'N/A'}
**Posted Date:** ${opportunity.postedDate || 'N/A'}

**Description:**
${opportunity.description || 'No description available'}

**Place of Performance:**
${opportunity.placeOfPerformance?.city?.name || ''}, ${opportunity.placeOfPerformance?.state?.name || ''} ${opportunity.placeOfPerformance?.country?.name || ''}

---

## COMPANY PROFILE

**Company Name:** ${company.name}
**UEI:** ${company.uei}
**CAGE Code:** ${company.cageCode || 'N/A'}
**Years in Business:** ${company.yearsInBusiness}
**Employee Count:** ${company.employeeCount}
**Annual Revenue:** ${company.annualRevenue}

**NAICS Codes:** ${company.naicsCodes.join(', ')}
**PSC Codes:** ${company.pscCodes?.join(', ') || 'N/A'}

**Small Business Certifications:** ${company.smallBusinessTypes?.join(', ') || 'None'}
**Other Certifications:** ${company.certifications?.join(', ') || 'None'}

**Core Competencies:**
${company.coreCompetencies?.join('\n- ') || 'Not specified'}

**Capabilities Statement:**
${company.capabilities}

**Key Differentiators:**
${company.differentiators || 'Not specified'}

**Past Performance:**
${company.pastPerformance?.map(pp => `
- ${pp.contractName} (${pp.agency})
  Contract #: ${pp.contractNumber}
  Value: ${pp.value}
  Period: ${pp.period}
  NAICS: ${pp.relevantNaics?.join(', ')}
  Description: ${pp.description}
`).join('\n') || 'No past performance listed'}

---

## ANALYSIS REQUEST

Please analyze this opportunity against the company profile and provide:
1. Scoring across all dimensions (0-100)
2. Detailed analysis including strengths, weaknesses, key requirements
3. A GO/NO-GO/CONSIDER recommendation with reasoning
4. Identify which past performance is most relevant
5. Recommended actions if pursuing this opportunity

Consider factors like:
- NAICS code alignment
- Set-aside eligibility based on certifications
- Capability match based on description and requirements
- Past performance relevance
- Geographic considerations
- Timeline feasibility
`;
}

export async function generateProposalOutline(
  opportunity: SamOpportunity,
  companyProfile: CompanyProfile,
  score: OpportunityScore
): Promise<string> {
  const result = await generateProposalOutlineWithTokens(opportunity, companyProfile, score);
  return result.outline;
}

export async function generateProposalOutlineWithTokens(
  opportunity: SamOpportunity,
  companyProfile: CompanyProfile,
  score: OpportunityScore
): Promise<{ outline: string; tokenUsage: TokenUsage }> {
  const openai = getOpenAIClient();
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are an expert government contracting proposal writer with 20+ years of experience writing winning federal proposals. Generate a comprehensive, detailed proposal outline that addresses all requirements and positions the company for success.

Your proposal outline should include:
1. Executive Summary with clear value proposition
2. Technical Approach with specific methodologies and solutions
3. Management Plan with organizational structure and key personnel
4. Past Performance with relevant project examples
5. Pricing Strategy overview
6. Risk Management approach

Make it specific, actionable, and tailored to the exact requirements in the solicitation. Use professional proposal language and structure.`
      },
      {
        role: 'user',
        content: `
## SOLICITATION DETAILS

**Title:** ${opportunity.title}
**Solicitation Number:** ${opportunity.solicitationNumber || 'N/A'}
**Agency:** ${opportunity.department}${opportunity.subTier ? ` - ${opportunity.subTier}` : ''}
**NAICS:** ${opportunity.naicsCode}
**Set-Aside:** ${opportunity.typeOfSetAsideDescription || 'Full and Open Competition'}
**Response Deadline:** ${opportunity.responseDeadLine}

**Full Requirements/Description:**
${opportunity.description || 'No detailed description available'}

---

## COMPANY PROFILE

**Company:** ${companyProfile.name}
**UEI:** ${companyProfile.uei}
**Years in Business:** ${companyProfile.yearsInBusiness}
**Employee Count:** ${companyProfile.employeeCount}
**Hourly Rate:** $${companyProfile.hourlyRate || 'TBD'}

**Core Capabilities:**
${companyProfile.capabilities}

**Technical Competencies:**
${companyProfile.coreCompetencies?.map(c => `• ${c}`).join('\n') || 'Not specified'}

**Competitive Advantages:**
${companyProfile.differentiators}

**NAICS Codes:** ${companyProfile.naicsCodes.join(', ')}
**Certifications:** ${companyProfile.smallBusinessTypes?.join(', ') || 'Standard Small Business'}

**Past Performance Projects:**
${companyProfile.pastPerformance && companyProfile.pastPerformance.length > 0 
  ? companyProfile.pastPerformance.map(pp => `
• ${pp.contractName} - ${pp.agency}
  - Contract: ${pp.contractNumber}
  - Value: ${pp.value}
  - Period: ${pp.period}
  - Description: ${pp.description}
`).join('\n')
  : 'Limited documented past performance - emphasize team expertise and capabilities'}

---

## OPPORTUNITY ANALYSIS

**Overall Fit Score:** ${score.overallScore}/100
**Recommendation:** ${score.analysis.bidNoGoBid}

**Key Strengths for This Opportunity:**
${score.analysis.strengths.map(s => `• ${s}`).join('\n')}

**Areas to Address:**
${score.analysis.weaknesses.map(w => `• ${w}`).join('\n')}

**Critical Requirements Identified:**
${score.analysis.keyRequirements.map(r => `• ${r}`).join('\n')}

**Recommended Focus Areas:**
${score.analysis.recommendedActions.map(a => `• ${a}`).join('\n')}

---

## PROPOSAL GENERATION REQUEST

Based on the above information, generate a DETAILED, SPECIFIC proposal outline that:

1. **Addresses every requirement** mentioned in the solicitation description
2. **Provides concrete technical approaches** - not just section titles, but actual strategies and methodologies
3. **Highlights the company's relevant strengths** from the analysis
4. **Mitigates weaknesses** by showing how the company will address gaps
5. **Includes specific deliverables and outcomes** for each major section
6. **Demonstrates understanding** of the agency's needs and constraints
7. **Provides a clear management structure** with roles and responsibilities
8. **References relevant past performance** (or explains capability despite limited past performance)

Structure the outline in standard government proposal format:
- Volume I: Technical Proposal
  - Executive Summary
  - Understanding of Requirements
  - Technical Approach & Methodology
  - Management Approach
  - Key Personnel & Organization
  - Past Performance & Corporate Experience
  - Quality Assurance Plan
  - Risk Management
  - Transition Plan (if applicable)
  
- Volume II: Pricing Proposal
  - Pricing Strategy Overview
  - Labor Categories & Rates
  - Cost Breakdown
  - Value Proposition

For EACH section, provide:
- Section overview (what will be covered)
- 3-5 specific bullet points with actual content/strategies
- Key messages to emphasize
- How it addresses the requirements

Make this a working document that could guide actual proposal development. Be specific and detailed, not generic.
`
      }
    ],
    temperature: 0.6,
    max_tokens: 4000,
  });
  
  const outline = response.choices[0]?.message?.content || '';
  
  const tokenUsage: TokenUsage = {
    promptTokens: response.usage?.prompt_tokens || 0,
    completionTokens: response.usage?.completion_tokens || 0,
    totalTokens: response.usage?.total_tokens || 0,
  };
  
  return { outline, tokenUsage };
}

export async function extractKeyRequirements(
  description: string
): Promise<string[]> {
  if (!description || description.trim().length === 0) {
    return [];
  }

  const openai = getOpenAIClient();
  
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert at analyzing government contract solicitations. Extract the key technical requirements, deliverables, qualifications, and capabilities needed from the solicitation description. Return ONLY a valid JSON array of strings, with each string being a specific requirement or capability needed. Focus on technical skills, certifications, experience levels, specific technologies, and deliverable requirements. Maximum 15 items.`
        },
        {
          role: 'user',
          content: `Extract key requirements from this solicitation:\n\n${description.substring(0, 3000)}`
        }
      ],
      temperature: 0.2,
      max_tokens: 1000,
    });
    
    const content = response.choices[0]?.message?.content;
    if (!content) {
      return [];
    }
    
    // Parse JSON array
    try {
      const requirements = JSON.parse(content);
      if (Array.isArray(requirements)) {
        return requirements.filter(r => typeof r === 'string' && r.length > 0);
      }
      return [];
    } catch {
      // If not valid JSON, try to extract from text
      return [];
    }
  } catch (error) {
    console.error('Error extracting requirements:', error);
    return [];
  }
}
