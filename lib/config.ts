import { z } from 'zod';

const schema = z.object({
  ANTHROPIC_API_KEY: z.string().min(1),
  SAM_GOV_API_KEY: z.string().min(1),
  CRON_SECRET: z.string().min(16, 'CRON_SECRET must be >= 16 chars'),
  DAILY_COST_CAP_USD: z.coerce.number().positive().default(2.0),
  DATABASE_URL: z.string().default('./data/govcontracts.db'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  ANTHROPIC_MODEL: z.string().default('claude-sonnet-4-6'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error']).default('info'),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n');
  throw new Error(`Invalid environment configuration:\n${issues}`);
}

export const config = {
  anthropicApiKey: parsed.data.ANTHROPIC_API_KEY,
  samGovApiKey: parsed.data.SAM_GOV_API_KEY,
  cronSecret: parsed.data.CRON_SECRET,
  dailyCostCapUsd: parsed.data.DAILY_COST_CAP_USD,
  databaseUrl: parsed.data.DATABASE_URL,
  nodeEnv: parsed.data.NODE_ENV,
  anthropicModel: parsed.data.ANTHROPIC_MODEL,
  logLevel: parsed.data.LOG_LEVEL,
} as const;

export type Config = typeof config;
