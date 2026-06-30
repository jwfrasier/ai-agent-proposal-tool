import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config';

export const anthropic = new Anthropic({
  apiKey: config.anthropicApiKey,
  maxRetries: 2,
});

// Pricing (USD per 1M tokens) — update when model/prices change.
export const PRICING: Record<string, { input: number; output: number }> = {
  'claude-sonnet-4-6': { input: 3.0, output: 15.0 },
  // Haiku 4.5 — used as the fallback tier. Approximate; verify against current pricing.
  'claude-haiku-4-5-20251001': { input: 1.0, output: 5.0 },
};

// Model fallback chain for the hardened runner: primary first, cheaper tiers after.
export const MODEL_CHAIN: string[] = [config.anthropicModel, 'claude-haiku-4-5-20251001'];

export function costFor(model: string, promptTokens: number, completionTokens: number): number {
  const p = PRICING[model] ?? PRICING['claude-sonnet-4-6']!;
  return (promptTokens / 1_000_000) * p.input + (completionTokens / 1_000_000) * p.output;
}
