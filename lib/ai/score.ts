import { anthropic, costFor } from './client';
import { ScoreSchema, ScoreJsonSchema } from './schemas';
import { config } from '../config';
import type { CompanyProfile, Opportunity } from '../db/schema';

export interface ScoreOutput {
  fitScore: number;
  recommendation: 'GO' | 'NO_GO' | 'MAYBE';
  naicsMatch: { matched: boolean; reason: string };
  capabilityMatch: { matched: boolean; reason: string };
  setasideMatch: { matched: boolean; reason: string };
  keyRequirements: string[];
  risks: string[];
  winThemes: string[];
  model: string;
  promptTokens: number;
  completionTokens: number;
  costUsd: number;
}

const SYSTEM = `You are an expert federal contracting analyst evaluating opportunities for a small business bidding on contracts at or below the Simplified Acquisition Threshold ($350,000). Past performance records are NOT required at this threshold; do not penalize for their absence.

You must call the record_score tool exactly once with your analysis.`;

function userPrompt(opp: Opportunity, profile: CompanyProfile): string {
  return `# Company profile
Name: ${profile.name}
NAICS codes: ${profile.naicsCodes.join(', ')}
Certifications: ${profile.certifications.join(', ') || 'none'}
Capabilities: ${profile.capabilities}

# Opportunity
Title: ${opp.title}
Agency: ${opp.agency}
NAICS: ${opp.naics ?? 'n/a'}
Set-aside: ${opp.setAside ?? 'none'}
Award ceiling: ${opp.awardCeiling != null ? `$${opp.awardCeiling.toLocaleString()}` : 'n/a'}
Response deadline: ${opp.responseDeadline?.toISOString() ?? 'n/a'}
Place of performance: ${opp.placeOfPerformance ?? 'n/a'}

Description:
${(opp.description ?? '').slice(0, 8000)}

Score this opportunity for fit. Be honest about risks and only recommend GO when the match is strong.`;
}

export async function scoreOpportunity(
  opp: Opportunity,
  profile: CompanyProfile,
): Promise<ScoreOutput> {
  const model = config.anthropicModel;
  const response = await anthropic.messages.create({
    model,
    max_tokens: 1500,
    system: SYSTEM,
    tools: [
      {
        name: 'record_score',
        description: 'Record the fit analysis for this opportunity.',
        input_schema: ScoreJsonSchema as never,
      },
    ],
    tool_choice: { type: 'tool', name: 'record_score' },
    messages: [{ role: 'user', content: userPrompt(opp, profile) }],
  });

  const toolUse = response.content.find(
    (c) => c.type === 'tool_use' && c.name === 'record_score',
  ) as { type: 'tool_use'; input: unknown } | undefined;
  if (!toolUse) throw new Error('Anthropic response missing record_score tool_use block');

  const parsed = ScoreSchema.parse(toolUse.input);
  const promptTokens = response.usage.input_tokens;
  const completionTokens = response.usage.output_tokens;

  return {
    fitScore: parsed.fit_score,
    recommendation: parsed.recommendation,
    naicsMatch: parsed.naics_match,
    capabilityMatch: parsed.capability_match,
    setasideMatch: parsed.setaside_match,
    keyRequirements: parsed.key_requirements,
    risks: parsed.risks,
    winThemes: parsed.win_themes,
    model: response.model,
    promptTokens,
    completionTokens,
    costUsd: costFor(response.model, promptTokens, completionTokens),
  };
}
