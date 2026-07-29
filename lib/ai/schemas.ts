import { z } from 'zod';

const Match = z.object({ matched: z.boolean(), reason: z.string() });

export const ScoreSchema = z.object({
  fit_score: z.number().int().min(0).max(100),
  recommendation: z.enum(['GO', 'NO_GO', 'MAYBE']),
  naics_match: Match,
  capability_match: Match,
  setaside_match: Match,
  key_requirements: z.array(z.string()),
  risks: z.array(z.string()),
  win_themes: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  confidence_reason: z.string(),
  ambiguity: z.enum(['none', 'missing_info', 'contradictory', 'borderline']),
});

export type ScoreResult = z.infer<typeof ScoreSchema>;

// JSON Schema form (what Anthropic tool definitions accept)
export const ScoreJsonSchema = {
  type: 'object',
  required: [
    'fit_score',
    'recommendation',
    'naics_match',
    'capability_match',
    'setaside_match',
    'key_requirements',
    'risks',
    'win_themes',
    'confidence',
    'confidence_reason',
    'ambiguity',
  ],
  properties: {
    fit_score: { type: 'integer', minimum: 0, maximum: 100 },
    recommendation: { type: 'string', enum: ['GO', 'NO_GO', 'MAYBE'] },
    naics_match: {
      type: 'object',
      required: ['matched', 'reason'],
      properties: { matched: { type: 'boolean' }, reason: { type: 'string' } },
    },
    capability_match: {
      type: 'object',
      required: ['matched', 'reason'],
      properties: { matched: { type: 'boolean' }, reason: { type: 'string' } },
    },
    setaside_match: {
      type: 'object',
      required: ['matched', 'reason'],
      properties: { matched: { type: 'boolean' }, reason: { type: 'string' } },
    },
    key_requirements: { type: 'array', items: { type: 'string' } },
    risks: { type: 'array', items: { type: 'string' } },
    win_themes: { type: 'array', items: { type: 'string' } },
    confidence: { type: 'number', minimum: 0, maximum: 1 },
    confidence_reason: { type: 'string' },
    ambiguity: { type: 'string', enum: ['none', 'missing_info', 'contradictory', 'borderline'] },
  },
} as const;

export const TriageSchema = z.object({
  verdict: z.enum(['advance', 'reject']),
  reason: z.string(),
});

export type TriageResult = z.infer<typeof TriageSchema>;

export const TriageJsonSchema = {
  type: 'object',
  required: ['verdict', 'reason'],
  properties: {
    verdict: { type: 'string', enum: ['advance', 'reject'] },
    reason: { type: 'string' },
  },
} as const;
