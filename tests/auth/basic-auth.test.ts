import { describe, it, expect } from 'vitest';
import { parseBasicAuth, timingSafeEqualStr } from '../../lib/auth/basic-auth';

// Helper to build a valid Basic Auth header from user:pass
function makeBasicHeader(user: string, pass: string): string {
  return `Basic ${btoa(`${user}:${pass}`)}`;
}

describe('parseBasicAuth', () => {
  it('returns credentials for a valid Basic Auth header', () => {
    const result = parseBasicAuth(makeBasicHeader('admin', 'secret'));
    expect(result).toEqual({ user: 'admin', pass: 'secret' });
  });

  it('returns credentials when username is empty', () => {
    const result = parseBasicAuth(makeBasicHeader('', 'mypassword'));
    expect(result).toEqual({ user: '', pass: 'mypassword' });
  });

  it('returns credentials when password contains a colon', () => {
    const result = parseBasicAuth(makeBasicHeader('user', 'pass:word:extra'));
    expect(result).toEqual({ user: 'user', pass: 'pass:word:extra' });
  });

  it('returns null for a null header', () => {
    expect(parseBasicAuth(null)).toBeNull();
  });

  it('returns null for an empty string header', () => {
    expect(parseBasicAuth('')).toBeNull();
  });

  it('returns null for a Bearer token (wrong scheme)', () => {
    expect(parseBasicAuth('Bearer sometoken')).toBeNull();
  });

  it('returns null for "Basic" with no credentials', () => {
    expect(parseBasicAuth('Basic ')).toBeNull();
  });

  it('returns null for invalid base64', () => {
    expect(parseBasicAuth('Basic !!!notbase64!!!')).toBeNull();
  });

  it('returns null when decoded value has no colon', () => {
    // base64 of "nocolon"
    const noColon = `Basic ${btoa('nocolon')}`;
    expect(parseBasicAuth(noColon)).toBeNull();
  });
});

describe('timingSafeEqualStr', () => {
  it('returns true for identical strings', () => {
    expect(timingSafeEqualStr('correct-horse-battery', 'correct-horse-battery')).toBe(true);
  });

  it('returns false for different strings of the same length', () => {
    expect(timingSafeEqualStr('password1', 'password2')).toBe(false);
  });

  it('returns false for different strings of different lengths', () => {
    expect(timingSafeEqualStr('short', 'much-longer-password')).toBe(false);
  });

  it('returns false when b is a prefix of a', () => {
    expect(timingSafeEqualStr('secretpassword', 'secret')).toBe(false);
  });

  it('returns false when a is a prefix of b', () => {
    expect(timingSafeEqualStr('secret', 'secretpassword')).toBe(false);
  });

  it('returns true for empty strings', () => {
    expect(timingSafeEqualStr('', '')).toBe(true);
  });

  it('returns false when one string is empty and the other is not', () => {
    expect(timingSafeEqualStr('', 'nonempty')).toBe(false);
    expect(timingSafeEqualStr('nonempty', '')).toBe(false);
  });

  it('is case-sensitive', () => {
    expect(timingSafeEqualStr('Password', 'password')).toBe(false);
  });
});
