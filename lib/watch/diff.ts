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
