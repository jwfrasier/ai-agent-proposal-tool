import { describe, it, expect, afterEach } from 'vitest';

describe('lib/config', () => {
  const original = { ...process.env };
  afterEach(() => { process.env = { ...original }; });

  it('parses required env vars', async () => {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
    process.env.SAM_GOV_API_KEY = 'sam-test';
    process.env.CRON_SECRET = 'a-long-enough-secret';
    process.env.DAILY_COST_CAP_USD = '1.50';
    process.env.DATABASE_URL = './test.db';
    const mod = await import('@/lib/config?fresh=' + Date.now());
    expect(mod.config.dailyCostCapUsd).toBe(1.5);
    expect(mod.config.samGovApiKey).toBe('sam-test');
  });

  it('throws on missing required env var', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    await expect(import('@/lib/config?fresh2=' + Date.now())).rejects.toThrow(/ANTHROPIC_API_KEY/);
  });
});
