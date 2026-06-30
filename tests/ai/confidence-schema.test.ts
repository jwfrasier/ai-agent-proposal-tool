import { describe, it, expect } from 'vitest';
import { ScoreSchema } from '../../lib/ai/schemas';

const baseValid = {
  fit_score: 75,
  recommendation: 'GO' as const,
  naics_match: { matched: true, reason: 'NAICS code aligns.' },
  capability_match: { matched: true, reason: 'Capabilities match.' },
  setaside_match: { matched: false, reason: 'No set-aside.' },
  key_requirements: ['Clearance required'],
  risks: ['Tight deadline'],
  win_themes: ['Past performance'],
};

describe('ScoreSchema confidence fields', () => {
  it('parses a valid object with all confidence fields', () => {
    const result = ScoreSchema.safeParse({
      ...baseValid,
      confidence: 0.85,
      confidence_reason: 'Strong NAICS alignment and matching capabilities.',
      ambiguity: 'none',
    });
    expect(result.success).toBe(true);
  });

  it('parses with ambiguity set to missing_info', () => {
    const result = ScoreSchema.safeParse({
      ...baseValid,
      confidence: 0.55,
      confidence_reason: 'Description lacks performance work statement.',
      ambiguity: 'missing_info',
    });
    expect(result.success).toBe(true);
  });

  it('parses with ambiguity set to contradictory', () => {
    const result = ScoreSchema.safeParse({
      ...baseValid,
      confidence: 0.4,
      confidence_reason: 'Budget figures contradict scope description.',
      ambiguity: 'contradictory',
    });
    expect(result.success).toBe(true);
  });

  it('parses with ambiguity set to borderline', () => {
    const result = ScoreSchema.safeParse({
      ...baseValid,
      confidence: 0.6,
      confidence_reason: 'Borderline NAICS match; could go either way.',
      ambiguity: 'borderline',
    });
    expect(result.success).toBe(true);
  });

  it('rejects confidence > 1', () => {
    const result = ScoreSchema.safeParse({
      ...baseValid,
      confidence: 1.1,
      confidence_reason: 'Out of range.',
      ambiguity: 'none',
    });
    expect(result.success).toBe(false);
  });

  it('rejects confidence < 0', () => {
    const result = ScoreSchema.safeParse({
      ...baseValid,
      confidence: -0.1,
      confidence_reason: 'Out of range.',
      ambiguity: 'none',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid ambiguity value', () => {
    const result = ScoreSchema.safeParse({
      ...baseValid,
      confidence: 0.7,
      confidence_reason: 'Some reason.',
      ambiguity: 'uncertain',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing confidence field', () => {
    const result = ScoreSchema.safeParse({
      ...baseValid,
      confidence_reason: 'Some reason.',
      ambiguity: 'none',
    });
    expect(result.success).toBe(false);
  });
});
