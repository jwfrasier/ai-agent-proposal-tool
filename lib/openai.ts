import OpenAI from 'openai';
import type { CompanyProfile, SamOpportunity, OpportunityScore, ScoreAnalysis } from '@/types';

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
  
  return {
    opportunityId: opportunity.noticeId,
    overallScore: parsed.overallScore,
    naicsMatch: parsed.naicsMatch,
    capabilityMatch: parsed.capabilityMatch,
    pastPerformanceRelevance: parsed.pastPerformanceRelevance,
    setAsideEligibility: parsed.setAsideEligibility,
    analysis: parsed.analysis as ScoreAnalysis,
    scoredAt: new Date().toISOString(),
  };
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
  const openai = getOpenAIClient();
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a government contracting proposal expert. Generate a detailed proposal outline based on the opportunity requirements and company capabilities. The outline should follow standard government proposal structure and highlight the company's strengths.`
      },
      {
        role: 'user',
        content: `
## OPPORTUNITY
Title: ${opportunity.title}
Solicitation: ${opportunity.solicitationNumber}
Agency: ${opportunity.department}
Description: ${opportunity.description}

## COMPANY
Name: ${companyProfile.name}
Capabilities: ${companyProfile.capabilities}
Core Competencies: ${companyProfile.coreCompetencies?.join(', ')}
Differentiators: ${companyProfile.differentiators}

## SCORING ANALYSIS
Overall Score: ${score.overallScore}/100
Strengths: ${score.analysis.strengths.join(', ')}
Key Requirements: ${score.analysis.keyRequirements.join(', ')}

Generate a comprehensive proposal outline with sections, subsections, and key points to address.
`
      }
    ],
    temperature: 0.5,
    max_tokens: 3000,
  });
  
  return response.choices[0]?.message?.content || '';
}
