import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the Anthropic client exactly as specified.
vi.mock('@/lib/ai/client', () => ({
  anthropic: { messages: { create: vi.fn() } },
  costFor: (_m: string, p: number, c: number) => (p / 1e6) * 3 + (c / 1e6) * 15,
  PRICING: { 'claude-sonnet-4-6': { input: 3, output: 15 } },
  MODEL_CHAIN: ['claude-sonnet-4-6', 'claude-haiku-4-5-20251001'],
}));

// Mock trace writer so tests don't touch the filesystem.
vi.mock('@/lib/ai/trace', () => ({ writeTrace: vi.fn() }));

import { anthropic } from '@/lib/ai/client';
import { writeTrace } from '@/lib/ai/trace';
import { runStructured, type RunStructuredOpts } from '@/lib/ai/run';
import { z } from 'zod';

// ── Shared test schema ────────────────────────────────────────────────────────
const TestSchema = z.object({ score: z.number().int().min(0).max(100) });
type TestResult = z.infer<typeof TestSchema>;

const baseOpts: RunStructuredOpts<TestResult> = {
  system: 'You are a scoring assistant.',
  userContent: 'Score this item.',
  toolName: 'record_score',
  toolDescription: 'Record the numeric score.',
  jsonSchema: {
    type: 'object',
    properties: { score: { type: 'integer', minimum: 0, maximum: 100 } },
    required: ['score'],
  },
  parse: (i: unknown) => TestSchema.parse(i),
  label: 'test:score',
};

// ── Helper factories ──────────────────────────────────────────────────────────
function makeSuccessResponse(model: string, score: number) {
  return {
    content: [{ type: 'tool_use', name: 'record_score', id: 'tu_1', input: { score } }],
    usage: { input_tokens: 200, output_tokens: 80 },
    model,
  };
}

function makeNoToolUseResponse(model: string) {
  return {
    content: [{ type: 'text', text: 'Here is my analysis.' }],
    usage: { input_tokens: 50, output_tokens: 20 },
    model,
  };
}

function makeApiError(status: number): Error {
  return Object.assign(new Error(`API error ${status}`), { status });
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('runStructured', () => {
  beforeEach(() => {
    vi.mocked(anthropic.messages.create as never).mockReset();
    vi.mocked(writeTrace as never).mockReset();
  });

  // (1) Happy path: first model succeeds, tierDowngraded is false.
  it('happy path: returns parsed value with tierDowngraded:false', async () => {
    vi.mocked(anthropic.messages.create as never).mockResolvedValueOnce(
      makeSuccessResponse('claude-sonnet-4-6', 82),
    );

    const result = await runStructured<TestResult>(baseOpts);

    expect(result.value).toEqual({ score: 82 });
    expect(result.model).toBe('claude-sonnet-4-6');
    expect(result.tierDowngraded).toBe(false);
    expect(result.promptTokens).toBe(200);
    expect(result.completionTokens).toBe(80);
    expect(result.costUsd).toBeCloseTo((200 / 1e6) * 3 + (80 / 1e6) * 15);
    expect(result.traceId).toBeTruthy();
    expect(typeof result.traceId).toBe('string');

    // Exactly one API call, one trace written.
    expect(anthropic.messages.create).toHaveBeenCalledTimes(1);
    expect(writeTrace).toHaveBeenCalledOnce();
    expect(vi.mocked(writeTrace).mock.calls[0]![0]!.validation).toBe('pass');
    expect(vi.mocked(writeTrace).mock.calls[0]![0]!.tierDowngraded).toBe(false);
  });

  // (2) First model throws 500 → second model succeeds → tierDowngraded:true.
  it('first model 500 error → second model succeeds → tierDowngraded:true', async () => {
    vi.mocked(anthropic.messages.create as never)
      .mockRejectedValueOnce(makeApiError(500))
      .mockResolvedValueOnce(makeSuccessResponse('claude-haiku-4-5-20251001', 55));

    const result = await runStructured<TestResult>(baseOpts);

    expect(result.value).toEqual({ score: 55 });
    expect(result.model).toBe('claude-haiku-4-5-20251001');
    expect(result.tierDowngraded).toBe(true);
    expect(anthropic.messages.create).toHaveBeenCalledTimes(2);
    expect(vi.mocked(writeTrace).mock.calls[0]![0]!.validation).toBe('pass');
    expect(vi.mocked(writeTrace).mock.calls[0]![0]!.tierDowngraded).toBe(true);
  });

  // (3) First model parse fails once → same-model retry succeeds.
  it('parse fails on first attempt → same-model retry succeeds', async () => {
    // First response: schema mismatch (score is a string, not a number).
    const badInput = { score: 'not-a-number' };
    vi.mocked(anthropic.messages.create as never)
      .mockResolvedValueOnce({
        content: [{ type: 'tool_use', name: 'record_score', id: 'tu_bad', input: badInput }],
        usage: { input_tokens: 150, output_tokens: 60 },
        model: 'claude-sonnet-4-6',
      })
      .mockResolvedValueOnce(makeSuccessResponse('claude-sonnet-4-6', 70));

    const result = await runStructured<TestResult>(baseOpts);

    // Should succeed on the retry (still first model, so not tier-downgraded).
    expect(result.value).toEqual({ score: 70 });
    expect(result.model).toBe('claude-sonnet-4-6');
    expect(result.tierDowngraded).toBe(false);
    expect(anthropic.messages.create).toHaveBeenCalledTimes(2);

    // Second call should include a corrective multi-turn conversation.
    const secondCallArgs = vi.mocked(anthropic.messages.create).mock.calls[1]![0] as {
      messages: Array<{ role: string; content: unknown }>;
    };
    expect(secondCallArgs.messages.length).toBeGreaterThan(1);
    const lastUserTurn = secondCallArgs.messages[secondCallArgs.messages.length - 1];
    expect(lastUserTurn?.role).toBe('user');
  });

  // (4) All models fail → runStructured throws.
  it('all models fail → throws with the last error message', async () => {
    // Both models reject with API errors.
    vi.mocked(anthropic.messages.create as never)
      .mockRejectedValueOnce(makeApiError(503))
      .mockRejectedValueOnce(makeApiError(429));

    await expect(runStructured<TestResult>(baseOpts)).rejects.toThrow(/429|503|API error/);

    // A fail trace must have been written.
    expect(writeTrace).toHaveBeenCalledOnce();
    expect(vi.mocked(writeTrace).mock.calls[0]![0]!.validation).toBe('fail');
  });

  // Extra: no tool_use block on first attempt → retry, still no block → move to next model.
  it('no tool_use block on both attempts → falls through to next model', async () => {
    vi.mocked(anthropic.messages.create as never)
      .mockResolvedValueOnce(makeNoToolUseResponse('claude-sonnet-4-6')) // first attempt
      .mockResolvedValueOnce(makeNoToolUseResponse('claude-sonnet-4-6')) // retry
      .mockResolvedValueOnce(makeSuccessResponse('claude-haiku-4-5-20251001', 33)); // fallback

    const result = await runStructured<TestResult>(baseOpts);
    expect(result.value).toEqual({ score: 33 });
    expect(result.tierDowngraded).toBe(true);
    expect(anthropic.messages.create).toHaveBeenCalledTimes(3);
  });

  // Extra: all models return no tool_use + retries → throws.
  it('no tool_use from any model → throws', async () => {
    vi.mocked(anthropic.messages.create as never)
      .mockResolvedValue(makeNoToolUseResponse('claude-sonnet-4-6'));

    await expect(runStructured<TestResult>(baseOpts)).rejects.toThrow();
    expect(vi.mocked(writeTrace).mock.calls[0]![0]!.validation).toBe('fail');
  });

  it('uses the models override instead of MODEL_CHAIN when provided', async () => {
    vi.mocked(anthropic.messages.create as never).mockResolvedValue({
      content: [{ type: 'tool_use', name: 'record_triage', input: { verdict: 'advance', reason: 'ok' } }],
      usage: { input_tokens: 100, output_tokens: 10 },
      model: 'claude-haiku-4-5-20251001',
    });

    const res = await runStructured({
      system: 'sys',
      userContent: 'u',
      toolName: 'record_triage',
      toolDescription: 'd',
      jsonSchema: { type: 'object' },
      parse: (x) => x,
      label: 'triage:test',
      models: ['claude-haiku-4-5-20251001'],
    });

    expect(res.model).toBe('claude-haiku-4-5-20251001');
    const call = vi.mocked(anthropic.messages.create as never).mock.calls[0][0];
    expect(call.model).toBe('claude-haiku-4-5-20251001');
  });
});
