import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/ai/client', () => ({
  anthropic: { messages: { create: vi.fn() } },
  costFor: () => 0.01,
}));

import { anthropic } from '@/lib/ai/client';
import { generateDoc } from '@/lib/ai/docs';

const profile = {
  id: 1, version: 1, name: 'Acme', uei: 'X', cageCode: null,
  naicsCodes: ['541512'], certifications: ['SB'], capabilities: 'IT',
  contactName: 'a', contactEmail: 'a@a.com', contactPhone: null,
  updatedAt: new Date(),
} as never;
const opp = {
  noticeId: 'n1', title: 'Help desk', agency: 'GSA', naics: '541512',
  description: 'Tier 1.', setAside: 'SB',
  rawJson: {}, postedAt: new Date(), responseDeadline: new Date(), awardCeiling: 200000,
  placeOfPerformance: 'DC', firstSeenAt: new Date(), lastSyncedAt: new Date(), status: 'new' as const,
} as never;

describe('generateDoc', () => {
  beforeEach(() => vi.mocked(anthropic.messages.create as never).mockReset());

  it('returns markdown text and token usage for analysis kind', async () => {
    vi.mocked(anthropic.messages.create as never).mockResolvedValue({
      content: [{ type: 'text', text: '# Analysis\n...' }],
      usage: { input_tokens: 500, output_tokens: 800 },
      model: 'claude-sonnet-4-6',
    });
    const out = await generateDoc('analysis', opp, profile);
    expect(out.markdown).toMatch(/^# /);
    expect(out.promptTokens).toBe(500);
  });

  it('rejects unknown kind', async () => {
    await expect(generateDoc('bogus' as never, opp, profile)).rejects.toThrow();
  });
});
