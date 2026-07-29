import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/ai/client', () => {
  return {
    anthropic: { messages: { create: vi.fn() } },
    costFor: (_m: string, p: number, c: number) => (p / 1_000_000) * 3 + (c / 1_000_000) * 15,
    PRICING: { 'claude-sonnet-4-6': { input: 3, output: 15 } },
    MODEL_CHAIN: ['claude-sonnet-4-6', 'claude-haiku-4-5-20251001'],
  };
});

// Traces do real fs writes; stub them out in unit tests.
vi.mock('@/lib/ai/trace', () => ({ writeTrace: vi.fn() }));

import { anthropic } from '@/lib/ai/client';
import { scoreOpportunity } from '@/lib/ai/score';

const fakeProfile = {
  id: 1, version: 3, name: 'Acme', uei: 'X',
  naicsCodes: ['541512'], certifications: ['SB'],
  capabilities: 'IT services.',
  contactName: 'a', contactEmail: 'a@a.com', contactPhone: null, cageCode: null,
  updatedAt: new Date(),
} as never;

const fakeOpp = {
  noticeId: 'n1', title: 'Help desk', agency: 'GSA', naics: '541512',
  setAside: 'Small Business', description: 'Tier 1 support.',
  awardCeiling: 200_000, responseDeadline: new Date(Date.now() + 10 * 86400_000),
  rawJson: {}, postedAt: new Date(), placeOfPerformance: 'DC',
  firstSeenAt: new Date(), lastSyncedAt: new Date(), status: 'new' as const,
};

describe('scoreOpportunity', () => {
  beforeEach(() => vi.mocked(anthropic.messages.create as never).mockReset());

  it('parses tool-use output and returns a validated Score', async () => {
    vi.mocked(anthropic.messages.create as never).mockResolvedValue({
      content: [
        {
          type: 'tool_use',
          name: 'record_score',
          input: {
            fit_score: 82,
            recommendation: 'GO',
            naics_match: { matched: true, reason: 'exact 541512' },
            capability_match: { matched: true, reason: 'IT services align' },
            setaside_match: { matched: true, reason: 'SB cert held' },
            key_requirements: ['24/7 coverage', 'ITIL'],
            risks: ['Tight deadline'],
            win_themes: ['Cost', 'Past performance'],
            confidence: 0.9,
            confidence_reason: 'Clear NAICS and capability match.',
            ambiguity: 'none',
          },
        },
      ],
      usage: { input_tokens: 1200, output_tokens: 300 },
      model: 'claude-sonnet-4-6',
    });

    const result = await scoreOpportunity(fakeOpp as never, fakeProfile);
    expect(result.fitScore).toBe(82);
    expect(result.recommendation).toBe('GO');
    expect(result.keyRequirements).toContain('24/7 coverage');
    expect(result.promptTokens).toBe(1200);
    expect(result.costUsd).toBeCloseTo((1200 / 1e6) * 3 + (300 / 1e6) * 15);
    expect(result.confidence).toBe(0.9);
    expect(result.ambiguity).toBe('none');
    expect(result.tierDowngraded).toBe(false);
    expect(result.traceId).toBeTruthy();
  });

  it('throws when model returns no tool_use block', async () => {
    vi.mocked(anthropic.messages.create as never).mockResolvedValue({
      content: [{ type: 'text', text: 'hi' }],
      usage: { input_tokens: 10, output_tokens: 5 },
      model: 'claude-sonnet-4-6',
    });
    await expect(scoreOpportunity(fakeOpp as never, fakeProfile)).rejects.toThrow(/tool_use/);
  });

  it('sends HTML-stripped, trimmed description to the model', async () => {
    vi.mocked(anthropic.messages.create as never).mockResolvedValue({
      content: [{ type: 'tool_use', name: 'record_score', input: {
        fit_score: 10, recommendation: 'NO_GO',
        naics_match: { matched: false, reason: '' }, capability_match: { matched: false, reason: '' },
        setaside_match: { matched: false, reason: '' }, key_requirements: [], risks: [], win_themes: [],
        confidence: 0.5, confidence_reason: 'x', ambiguity: 'none',
      } }],
      usage: { input_tokens: 100, output_tokens: 20 },
      model: 'claude-sonnet-4-6',
    });
    const oppWithHtml = { ...fakeOpp, description: '<p>Custom&nbsp;portal</p>' };
    await scoreOpportunity(oppWithHtml as never, fakeProfile);
    const sent = vi.mocked(anthropic.messages.create as never).mock.calls[0][0];
    const userText = sent.messages[0].content;
    expect(userText).toContain('Custom portal');   // entities decoded, tags stripped
    expect(userText).not.toContain('<p>');          // no raw HTML
  });
});
