import { describe, expect, it } from 'vitest';
import { countdown, diffSnapshots, parseFpdsAtomTitles, type NoticeSnapshot } from '../../lib/watch/diff';

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

describe('award tracking (FPDS)', () => {
  it('alarms when an award posts against the solicitation', () => {
    const curr: NoticeSnapshot = {
      ...base,
      awards: ['New PURCHASE ORDER 90MC0026P0207 awarded to MOODLE US LLC for the amount of $356,700'],
    };
    const changes = diffSnapshots({ ...base, awards: [] }, curr);
    expect(changes).toHaveLength(1);
    expect(changes[0].severity).toBe('alarm');
    expect(changes[0].message).toContain('AWARD POSTED');
    expect(changes[0].message).toContain('MOODLE US LLC');
  });

  it('treats a missing awards field on old state as empty (no false alarm on upgrade)', () => {
    expect(diffSnapshots(base, { ...base, awards: [] })).toEqual([]);
  });

  it('does not re-alarm on an award already seen', () => {
    const a = ['New PURCHASE ORDER X awarded to Y for the amount of $1'];
    expect(diffSnapshots({ ...base, awards: a }, { ...base, awards: [...a] })).toEqual([]);
  });
});

describe('parseFpdsAtomTitles', () => {
  it('extracts entry titles from the FPDS ATOM feed', () => {
    const xml = `<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom"><title><![CDATA[FPDS-NG search results for: X]]></title>
<entry><title><![CDATA[New PURCHASE ORDER 1305M326P0344 awarded to VALINOR LABS, LLC for the amount of $28,665]]></title></entry>
<entry><title><![CDATA[PURCHASE ORDER 90MC0026P0187 (P00001) awarded to MOBOMO, LLC, was modified for the amount of $0]]></title></entry></feed>`;
    expect(parseFpdsAtomTitles(xml)).toEqual([
      'New PURCHASE ORDER 1305M326P0344 awarded to VALINOR LABS, LLC for the amount of $28,665',
      'PURCHASE ORDER 90MC0026P0187 (P00001) awarded to MOBOMO, LLC, was modified for the amount of $0',
    ]);
  });
  it('returns [] for a feed with no entries', () => {
    expect(parseFpdsAtomTitles('<feed><title><![CDATA[none]]></title></feed>')).toEqual([]);
  });
});
