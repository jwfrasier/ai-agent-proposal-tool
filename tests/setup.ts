import { beforeEach } from 'vitest';

process.env.ANTHROPIC_API_KEY ??= 'test-anthropic-key';
process.env.SAM_GOV_API_KEY ??= 'test-sam-key';
process.env.CRON_SECRET ??= 'test-cron-secret-1234';
process.env.DAILY_COST_CAP_USD ??= '2.00';
process.env.DATABASE_URL ??= ':memory:';
process.env.NODE_ENV ??= 'test';

beforeEach(() => {
  // Per-test cleanup hooks added later.
});
