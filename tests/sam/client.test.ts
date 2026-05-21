import { describe, it, expect, vi, beforeEach } from 'vitest';
import fixture from '../fixtures/sam-search-response.json';

describe('lib/sam/client', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('sends API key as header, never in URL', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(fixture), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    const { samFetch } = await import('@/lib/sam/client');
    await samFetch('/opportunities/v2/search', { naics: '541512' });
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(String(url)).not.toContain('api_key');
    expect((init as RequestInit).headers).toMatchObject({ 'X-Api-Key': 'test-sam-key' });
  });

  it('retries 5xx then succeeds', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('boom', { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(fixture), { status: 200 }));
    const { samFetch } = await import('@/lib/sam/client');
    const result = await samFetch('/opportunities/v2/search', { naics: '541512' });
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect((result as { totalRecords: number }).totalRecords).toBe(2);
  });

  it('throws after exhausting retries', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('boom', { status: 502 }));
    const { samFetch } = await import('@/lib/sam/client');
    await expect(samFetch('/opportunities/v2/search', {})).rejects.toThrow(/SAM/);
  });

  it('rejects non-SAM hosts', async () => {
    const { samFetch } = await import('@/lib/sam/client');
    await expect(samFetch('https://evil.example.com/x', {})).rejects.toThrow(/host/i);
  });
});
