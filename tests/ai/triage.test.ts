import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/ai/client', () => ({
  anthropic: { messages: { create: vi.fn() } },
  costFor: (_m: string, p: number, c: number) => (p / 1_000_000) * 1 + (c / 1_000_000) * 5,
  PRICING: { 'claude-haiku-4-5-20251001': { input: 1, output: 5 } },
  MODEL_CHAIN: ['claude-sonnet-4-6', 'claude-haiku-4-5-20251001'],
}));
vi.mock('@/lib/ai/trace', () => ({ writeTrace: vi.fn() }));

import { anthropic } from '@/lib/ai/client';
import { triageOpportunity } from '@/lib/ai/triage';

const profile = { name: 'Acme', naicsCodes: ['541511'], certifications: ['SB'], capabilities: 'IT' } as never;
const opp = {
  noticeId: 'n1', title: 'Custom web app', agency: 'GSA', naics: '541511',
  setAside: 'Small Business', awardCeiling: 200_000, description: 'Build a custom portal.',
  responseDeadline: new Date(), placeOfPerformance: 'DC', rawJson: {},
} as never;

describe('triageOpportunity', () => {
  beforeEach(() => vi.mocked(anthropic.messages.create as never).mockReset());

  it('returns advance and uses Haiku first', async () => {
    vi.mocked(anthropic.messages.create as never).mockResolvedValue({
      content: [{ type: 'tool_use', name: 'record_triage', input: { verdict: 'advance', reason: 'in lane' } }],
      usage: { input_tokens: 120, output_tokens: 8 },
      model: 'claude-haiku-4-5-20251001',
    });
    const r = await triageOpportunity(opp, profile);
    expect(r.verdict).toBe('advance');
    expect(r.model).toBe('claude-haiku-4-5-20251001');
    expect(r.costUsd).toBeGreaterThan(0);
    const call = vi.mocked(anthropic.messages.create as never).mock.calls[0][0];
    expect(call.model).toBe('claude-haiku-4-5-20251001');
  });

  it('returns reject when the model says reject', async () => {
    vi.mocked(anthropic.messages.create as never).mockResolvedValue({
      content: [{ type: 'tool_use', name: 'record_triage', input: { verdict: 'reject', reason: 'hardware buy' } }],
      usage: { input_tokens: 120, output_tokens: 8 },
      model: 'claude-haiku-4-5-20251001',
    });
    const r = await triageOpportunity(opp, profile);
    expect(r.verdict).toBe('reject');
  });
});
