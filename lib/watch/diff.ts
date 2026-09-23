// Pure diff/countdown logic for the notice watch monitor (scripts/watch.ts).
// Kept I/O-free so it is unit-testable; the script owns fetching and state.

export interface NoticeSnapshot {
  noticeId: string; // the CURRENT latest revision id
  title: string;
  solicitationNumber: string | null;
  archived: boolean;
  cancelled: boolean;
  modifiedDate: string | null;
  responseDeadline: string | null; // ISO from SAM (data2.solicitation.deadlines.response)
  attachments: string[]; // file names, sorted
  awards?: string[]; // FPDS action titles for the solicitation (award / mod lines), sorted; absent on pre-upgrade state
  /** Every notice SAM lists for the entry's watched organization (any status). A NEW id
   *  here is how a fresh RFQ from an office we answered an RFI for gets caught — it is a
   *  new notice id, not a revision, so chain-following alone never sees it. */
  officeNotices?: OfficeNotice[];
}

export interface OfficeNotice {
  id: string;
  label: string; // "<solnum> <title>"
}

/** Pull entry titles out of an FPDS-NG ATOM feed (ezsearch/FEEDS/ATOM). */
export function parseFpdsAtomTitles(xml: string): string[] {
  const out: string[] = [];
  const re = /<entry>[\s\S]*?<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) out.push((m[1] ?? "").trim());
  return out;
}

export interface WatchChange {
  severity: 'alarm' | 'notice';
  message: string;
}

export function diffSnapshots(
  prev: NoticeSnapshot | undefined,
  curr: NoticeSnapshot
): WatchChange[] {
  if (!prev) return []; // first sighting seeds state; nothing to compare
  const changes: WatchChange[] = [];

  if (prev.noticeId !== curr.noticeId) {
    changes.push({
      severity: 'alarm',
      message: `NEW REVISION posted (likely an amendment): ${prev.noticeId} → ${curr.noticeId}`,
    });
  }
  if (!prev.cancelled && curr.cancelled) {
    changes.push({ severity: 'alarm', message: 'Notice flipped to CANCELLED' });
  }
  if (prev.cancelled && !curr.cancelled) {
    changes.push({ severity: 'alarm', message: 'CANCELLED flag CLEARED (notice live again)' });
  }
  if (!prev.archived && curr.archived) {
    changes.push({ severity: 'alarm', message: 'Notice flipped to ARCHIVED' });
  }
  if (prev.archived && !curr.archived) {
    changes.push({ severity: 'notice', message: 'Archived flag cleared' });
  }
  if (prev.responseDeadline !== curr.responseDeadline) {
    changes.push({
      severity: 'alarm',
      message: `Response deadline changed: ${prev.responseDeadline ?? 'none'} → ${curr.responseDeadline ?? 'none'}`,
    });
  }

  const prevSet = new Set(prev.attachments);
  const currSet = new Set(curr.attachments);
  const added = curr.attachments.filter((a) => !prevSet.has(a));
  const removed = prev.attachments.filter((a) => !currSet.has(a));
  for (const a of added) {
    changes.push({ severity: 'alarm', message: `New attachment: ${a}` });
  }
  for (const a of removed) {
    changes.push({ severity: 'notice', message: `Attachment removed: ${a}` });
  }

  const prevOffice = new Set((prev.officeNotices ?? []).map((n) => n.id));
  if (prev.officeNotices) {
    for (const n of curr.officeNotices ?? []) {
      if (!prevOffice.has(n.id)) {
        changes.push({ severity: 'alarm', message: `NEW NOTICE from watched office: ${n.label} (https://sam.gov/opp/${n.id}/view)` });
      }
    }
  }

  const prevAwards = new Set(prev.awards ?? []);
  for (const a of curr.awards ?? []) {
    if (!prevAwards.has(a)) changes.push({ severity: 'alarm', message: `AWARD POSTED (FPDS): ${a}` });
  }

  if (
    changes.length === 0 &&
    prev.modifiedDate !== curr.modifiedDate
  ) {
    // Something changed server-side that none of the tracked fields captured.
    changes.push({
      severity: 'notice',
      message: `Notice modified (${prev.modifiedDate} → ${curr.modifiedDate}) with no tracked-field change — eyeball it on SAM`,
    });
  }
  return changes;
}

export interface Countdown {
  label: 'PAST' | 'ALARM' | 'WARN' | 'ok';
  days: number; // fractional days remaining (negative if past)
  text: string;
}

export function countdown(deadlineIso: string | null, now: Date): Countdown | null {
  if (!deadlineIso) return null;
  const deadline = new Date(deadlineIso);
  if (Number.isNaN(deadline.getTime())) return null;
  const ms = deadline.getTime() - now.getTime();
  const days = ms / 86_400_000;
  const abs = Math.abs(days);
  let human: string;
  if (abs >= 2) {
    let d = Math.floor(abs);
    let h = Math.round((abs % 1) * 24);
    if (h === 24) {
      d += 1;
      h = 0;
    }
    human = `${d}d ${h}h`;
  } else {
    human = `${Math.round(abs * 24)}h`;
  }
  if (days < 0) return { label: 'PAST', days, text: `${human} ago` };
  if (days < 2) return { label: 'ALARM', days, text: `${human} left` };
  if (days < 5) return { label: 'WARN', days, text: `${human} left` };
  return { label: 'ok', days, text: `${human} left` };
}

/**
 * Unfilled must-name gap on a GO bid. Three bids (COPEweb, DoWEA, DOS Cultural Property)
 * lapsed at the plan stage because a must-have — an SME, a PM, a form — had a date in the
 * bid plan and nothing fired it. This fires every run from 3 days before `staffingDeadline`
 * until the entry's `staffingGap` is cleared, so it nags rather than diffs.
 */
export function staffingAlarm(
  entry: { staffingGap?: string; staffingDeadline?: string },
  now: Date
): WatchChange | null {
  if (!entry.staffingGap || !entry.staffingDeadline) return null;
  const cd = countdown(entry.staffingDeadline, now);
  if (!cd) return null;
  if (cd.days > 3) return null;
  if (cd.days < 0) {
    return { severity: 'alarm', message: `STAFFING GAP OVERDUE (${cd.text}): ${entry.staffingGap} — fill it or NO-BID now` };
  }
  return { severity: 'alarm', message: `STAFFING GAP unfilled, ${cd.text} to source: ${entry.staffingGap}` };
}
