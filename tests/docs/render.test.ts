import { describe, it, expect } from 'vitest';
import { renderMarkdownToPdf } from '@/lib/docs/render';

describe('renderMarkdownToPdf', () => {
  it('produces a PDF buffer starting with %PDF', async () => {
    const buf = await renderMarkdownToPdf('# Title\n\nHello **world**.\n\n- one\n- two');
    expect(buf.length).toBeGreaterThan(500);
    expect(buf.slice(0, 4).toString()).toBe('%PDF');
  });
});
