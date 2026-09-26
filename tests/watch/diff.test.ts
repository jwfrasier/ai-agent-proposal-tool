import { describe, expect, it } from 'vitest';
import { countdown, diffSnapshots, parseFpdsAtomTitles, reminderAlarm, staffingAlarm, type NoticeSnapshot } from '../../lib/watch/diff';

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

describe('office watch (new notices from a watched organization)', () => {
  const n1 = { id: 'n1', label: '90MC26Q0005 READINESS SIMULATION' };
  const n2 = { id: 'n2', label: '90MC26Q0006 SSS Moodle LMS Modernization' };
  it('alarms on a notice id not seen before', () => {
    const changes = diffSnapshots({ ...base, officeNotices: [n1] }, { ...base, officeNotices: [n1, n2] });
    expect(changes).toHaveLength(1);
    expect(changes[0].severity).toBe('alarm');
    expect(changes[0].message).toContain('NEW NOTICE from watched office');
    expect(changes[0].message).toContain('90MC26Q0006');
  });
  it('is silent when the office list is unchanged or absent on old state', () => {
    expect(diffSnapshots({ ...base, officeNotices: [n1] }, { ...base, officeNotices: [n1] })).toEqual([]);
    expect(diffSnapshots(base, { ...base, officeNotices: [n1] })).toEqual([]);
  });
});

describe('staffingAlarm (unfilled must-name gap on a GO bid)', () => {
  const now = new Date('2026-09-15T12:00:00Z');
  it('is silent with no gap declared', () => {
    expect(staffingAlarm({}, now)).toBeNull();
    expect(staffingAlarm({ staffingGap: 'cultural-property SME' }, now)).toBeNull();
  });
  it('is silent when the staffing date is more than 3 days out', () => {
    expect(staffingAlarm({ staffingGap: 'SME', staffingDeadline: '2026-09-19T12:00:00Z' }, now)).toBeNull();
  });
  it('alarms inside 3 days and says what is unfilled', () => {
    const c = staffingAlarm({ staffingGap: 'cultural-property SME', staffingDeadline: '2026-09-17T12:00:00Z' }, now);
    expect(c?.severity).toBe('alarm');
    expect(c?.message).toContain('STAFFING GAP');
    expect(c?.message).toContain('cultural-property SME');
    expect(c?.message).toContain('2d');
  });
  it('alarms harder once the staffing date has passed', () => {
    const c = staffingAlarm({ staffingGap: 'SME', staffingDeadline: '2026-09-14T12:00:00Z' }, now);
    expect(c?.severity).toBe('alarm');
    expect(c?.message).toMatch(/OVERDUE/);
  });
});

describe('reminderAlarm (dated to-do on a watch entry)', () => {
  const r = { reminder: 'Ask CO Kaplan for the invoice guide', remindOn: '2026-10-05' };
  it('is silent with no reminder or before the date', () => {
    expect(reminderAlarm({}, new Date('2026-10-05T15:00:00Z'))).toBeNull();
    expect(reminderAlarm(r, new Date('2026-10-04T15:00:00Z'))).toBeNull();
  });
  it('alarms on the date with the reminder text', () => {
    const c = reminderAlarm(r, new Date('2026-10-05T13:00:00Z'));
    expect(c?.severity).toBe('alarm');
    expect(c?.message).toContain('REMINDER');
    expect(c?.message).toContain('invoice guide');
  });
  it('keeps alarming after the date until the reminder is deleted', () => {
    expect(reminderAlarm(r, new Date('2026-10-09T13:00:00Z'))?.message).toContain('4d overdue');
  });
});
