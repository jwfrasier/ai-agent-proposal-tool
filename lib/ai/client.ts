import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config';

export const anthropic = new Anthropic({
  apiKey: config.anthropicApiKey,
  maxRetries: 2,
});

// Sonnet 4.6 pricing (USD per 1M tokens) — update when model/prices change.
export const PRICING: Record<string, { input: number; output: number }> = {
  'claude-sonnet-4-6': { input: 3.0, output: 15.0 },
};

export function costFor(model: string, promptTokens: number, completionTokens: number): number {
  const p = PRICING[model] ?? PRICING['claude-sonnet-4-6']!;
  return (promptTokens / 1_000_000) * p.input + (completionTokens / 1_000_000) * p.output;
}
