import { describe, it, expect } from 'vitest';
import { log } from '@/lib/log';

describe('lib/log', () => {
  it('exports a pino logger with the expected methods', () => {
    expect(typeof log.info).toBe('function');
    expect(typeof log.error).toBe('function');
    expect(typeof log.child).toBe('function');
  });
});
