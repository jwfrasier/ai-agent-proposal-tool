import { describe, it, expect } from 'vitest';
import { isBiddableNoticeType, noticeTypeOf } from '@/lib/sam/notice-type';

describe('isBiddableNoticeType', () => {
  it('treats live solicitation types as biddable', () => {
    for (const t of ['Solicitation', 'Combined Synopsis/Solicitation', 'Presolicitation', 'Sources Sought', 'Special Notice']) {
      expect(isBiddableNoticeType(t)).toBe(true);
    }
  });

  it('skips award and justification notices', () => {
    expect(isBiddableNoticeType('Award Notice')).toBe(false);
    expect(isBiddableNoticeType('Justification')).toBe(false);
  });

  it('defaults unknown/empty types to biddable (never silently drop)', () => {
    expect(isBiddableNoticeType(null)).toBe(true);
    expect(isBiddableNoticeType(undefined)).toBe(true);
    expect(isBiddableNoticeType('Some New Type')).toBe(true);
  });
});

describe('noticeTypeOf', () => {
  it('extracts the type from rawJson', () => {
    expect(noticeTypeOf({ type: 'Justification' })).toBe('Justification');
  });
  it('returns null when absent or malformed', () => {
    expect(noticeTypeOf({})).toBeNull();
    expect(noticeTypeOf(null)).toBeNull();
    expect(noticeTypeOf({ type: 5 })).toBeNull();
  });
});
