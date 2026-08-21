import { describe, expect, it } from 'vitest';
import { countdown, diffSnapshots, type NoticeSnapshot } from '../../lib/watch/diff';

const base: NoticeSnapshot = {
  noticeId: 'aaa',
  title: 'Test Notice',
  solicitationNumber: 'SOL-1',
  archived: false,
  cancelled: false,
  modifiedDate: '2026-08-17T18:10:14.325+00:00',
  responseDeadline: '2026-08-25T11:00:00-04:00',
  attachments: ['solicitation.pdf', 'amd0001.pdf'],
};

describe('diffSnapshots', () => {
  it('first sighting produces no changes', () => {
    expect(diffSnapshots(undefined, base)).toEqual([]);
  });

  it('no-op when nothing changed', () => {
    expect(diffSnapshots(base, { ...base })).toEqual([]);
  });

  it('alarms on cancellation, archive, revision, deadline, and new attachments', () => {
    const curr: NoticeSnapshot = {
      ...base,
      noticeId: 'bbb',
      cancelled: true,
      archived: true,
      responseDeadline: '2026-09-01T11:00:00-04:00',
      attachments: [...base.attachments, 'amd0002-QA.pdf'],
    };
    const changes = diffSnapshots(base, curr);
    const messages = changes.map((c) => c.message).join(' | ');
    expect(changes.every((c) => c.severity === 'alarm')).toBe(true);
    expect(messages).toContain('NEW REVISION');
    expect(messages).toContain('CANCELLED');
    expect(messages).toContain('ARCHIVED');
    expect(messages).toContain('deadline changed');
    expect(messages).toContain('amd0002-QA.pdf');
  });

  it('reports cancelled flag clearing as an alarm (send gate opens)', () => {
    const prev = { ...base, cancelled: true };
    const changes = diffSnapshots(prev, base);
    expect(changes).toHaveLength(1);
    expect(changes[0].message).toContain('CLEARED');
  });

  it('falls back to a modified-date notice when nothing tracked changed', () => {
    const curr = { ...base, modifiedDate: '2026-08-21T09:00:00.000+00:00' };
    const changes = diffSnapshots(base, curr);
    expect(changes).toHaveLength(1);
    expect(changes[0].severity).toBe('notice');
    expect(changes[0].message).toContain('eyeball');
  });
});

describe('countdown', () => {
  const now = new Date('2026-08-21T12:00:00-04:00');
  it('labels by proximity', () => {
    expect(countdown('2026-08-21T15:00:00-04:00', now)?.label).toBe('ALARM');
    expect(countdown('2026-08-25T11:00:00-04:00', now)?.label).toBe('WARN');
    expect(countdown('2026-09-04T10:00:00-04:00', now)?.label).toBe('ok');
    expect(countdown('2026-08-20T10:00:00-04:00', now)?.label).toBe('PAST');
  });
  it('handles null and garbage', () => {
    expect(countdown(null, now)).toBeNull();
    expect(countdown('not-a-date', now)).toBeNull();
  });
});
