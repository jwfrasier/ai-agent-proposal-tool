import { describe, it, expect } from 'vitest';
import { trimForScoring } from '@/lib/ai/trim';

describe('trimForScoring', () => {
  it('strips HTML tags and collapses whitespace', () => {
    expect(trimForScoring('<p>Hello&nbsp; <b>world</b></p>\n\n\n  x')).toBe('Hello world x');
  });

  it('truncates to maxChars with an ellipsis marker', () => {
    const out = trimForScoring('a'.repeat(50), 10);
    expect(out.length).toBeLessThanOrEqual(11); // 10 + ellipsis char budget
    expect(out.endsWith('…')).toBe(true);
  });

  it('returns empty string for null/undefined', () => {
    expect(trimForScoring(null)).toBe('');
    expect(trimForScoring(undefined)).toBe('');
  });

  it('is idempotent on already-clean short text', () => {
    const clean = 'Custom web modernization services.';
    expect(trimForScoring(trimForScoring(clean))).toBe(clean);
  });

  it('keeps plain-text angle brackets that are not HTML tags', () => {
    expect(trimForScoring('budget < 3 and > 2, contracts under < $350k')).toBe(
      'budget < 3 and > 2, contracts under < $350k',
    );
  });
});
