// Pure parsing/scanning logic for the roster consistency checker
// (scripts/roster-check.ts). Kept I/O-free so it is unit-testable; the script
// owns file discovery and reading — same split as lib/watch/diff.ts + scripts/watch.ts.
//
// Why it exists: docs/people/ is the source of truth for everyone Frasier may
// name in a proposal, and bid documents have drifted from it before — rates
// cited inconsistently, reference POCs nearly staffed onto teams (the Ethan
// Gula rule), UNVERIFIED facts almost shipping. This module cross-checks every
// person card against every response doc and assembles review findings.

export const PERSON_STATUSES = [
  'reference-POC',
  'do-not-use',
  'active-bid',
  'bench',
  'prospect',
  'principal',
] as const;
export type PersonStatus = (typeof PERSON_STATUSES)[number];

/** Statuses that must never be proposed on a bid team. */
export const FLAGGED_STATUSES: readonly PersonStatus[] = ['reference-POC', 'do-not-use'];

export interface PersonCard {
  fileName: string; // e.g. 'ethan-gula.md'
  name: string; // canonical full name, e.g. 'Ethan Gula'
  status: PersonStatus | null;
  statusText: string | null; // raw status bullet text (for context in reports)
  rates: string[]; // normalized '$NN/hr' figures found anywhere on the card
  unverifiedLines: LineHit[]; // card lines containing 'UNVERIFIED'
}

export interface LineHit {
  line: number; // 1-based
  text: string;
}

export interface DocMention {
  file: string;
  line: number; // 1-based
  text: string;
}

export interface RateMismatch extends DocMention {
  docRates: string[]; // figures on this line NOT in the card's rate set
  cardRates: string[]; // the card's full rate set, for the report
}

export interface UnverifiedReminder {
  files: string[]; // unique response docs where the person appears
  mentionCount: number;
  unverifiedLines: LineHit[]; // the card lines that carry the UNVERIFIED mark
}

export interface PersonFindings {
  name: string;
  status: PersonStatus | null;
  /** Mentions of a reference-POC / do-not-use person in response docs. */
  statusFlags: DocMention[];
  rateMismatches: RateMismatch[];
  unverifiedReminder: UnverifiedReminder | null;
}

export interface RosterReport {
  people: PersonFindings[]; // only people with at least one finding
  counts: {
    statusFlags: number;
    rateMismatches: number;
    unverifiedReminders: number;
  };
}

/** 'kenneth-benavides.md' → 'Kenneth Benavides' (fallback when the H1 is unusable). */
export function nameFromFileName(fileName: string): string {
  return fileName
    .replace(/\.md$/i, '')
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/**
 * Extract every $NN/hr figure from a text, normalized to '$NN/hr'.
 * Handles the card formats in the wild: '$75/hr', '**$65/hr (1099)**',
 * '$72.50/hour', '$50 / hr'. Deduped, order of first appearance.
 */
export function extractRates(text: string): string[] {
  const re = /\$\s*(\d+(?:\.\d+)?)\s*\/\s*(?:hr|hour)\b/gi;
  const seen = new Set<string>();
  const rates: string[] = [];
  for (const m of text.matchAll(re)) {
    const normalized = `$${Number.parseFloat(m[1] ?? '')}/hr`;
    if (!seen.has(normalized)) {
      seen.add(normalized);
      rates.push(normalized);
    }
  }
  return rates;
}

/**
 * Detect the canonical status token inside a status bullet's text.
 * Cards phrase status freely ('bench (no active-bid assignment)',
 * '⛔ **reference-POC — DO NOT propose…**'), so when several tokens appear the
 * EARLIEST occurrence wins — 'bench (no active-bid…)' is bench, not active-bid.
 */
export function detectStatus(statusText: string): PersonStatus | null {
  const lower = statusText.toLowerCase();
  let best: PersonStatus | null = null;
  let bestIdx = Number.POSITIVE_INFINITY;
  for (const status of PERSON_STATUSES) {
    const idx = lower.indexOf(status.toLowerCase());
    if (idx !== -1 && idx < bestIdx) {
      best = status;
      bestIdx = idx;
    }
  }
  return best;
}

/**
 * Parse one docs/people/ card. Name comes from the H1 (bracketed asides like
 * '[surname spelling unverified]' stripped); the filename is the fallback.
 */
export function parsePersonCard(fileName: string, content: string): PersonCard {
  const lines = content.split('\n');

  let name = '';
  const h1 = lines.find((l) => /^#\s+\S/.test(l));
  if (h1) {
    name = h1
      .replace(/^#\s+/, '')
      .replace(/\[[^\]]*\]/g, '') // drop bracketed asides
      .replace(/[*_`]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
  if (name.split(' ').length < 2) name = nameFromFileName(fileName);

  // Status bullet: the '- **Status:** …' line plus its indented continuations.
  let statusText: string | null = null;
  const statusIdx = lines.findIndex((l) => /^\s*[-*]\s*\*\*Status:?\*\*/i.test(l));
  if (statusIdx !== -1) {
    const block = [lines[statusIdx] ?? ''];
    for (let i = statusIdx + 1; i < lines.length; i++) {
      // continuation lines are indented and not themselves bullets/headings
      const line = lines[i] ?? '';
      if (/^\s+\S/.test(line) && !/^\s*[-*#]/.test(line)) block.push(line);
      else break;
    }
    statusText = block.join(' ').replace(/\s+/g, ' ').trim();
  }

  const unverifiedLines: LineHit[] = [];
  lines.forEach((text, i) => {
    // case-sensitive on purpose: the roster convention is an explicit
    // UNVERIFIED marker, not casual uses of the word
    if (text.includes('UNVERIFIED')) unverifiedLines.push({ line: i + 1, text: text.trim() });
  });

  return {
    fileName,
    name,
    status: statusText ? detectStatus(statusText) : null,
    statusText,
    rates: extractRates(content),
    unverifiedLines,
  };
}

/** Regex matching a full name, case-insensitive, whitespace-flexible between parts. */
export function nameRegex(fullName: string): RegExp {
  const parts = fullName
    .trim()
    .split(/\s+/)
    .map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(`(?<![A-Za-z])${parts.join('\\s+')}(?![A-Za-z])`, 'i');
}

/** Every line of `content` mentioning the person's full name (case-insensitive). */
export function findNameMentions(fullName: string, content: string): LineHit[] {
  const re = nameRegex(fullName);
  const hits: LineHit[] = [];
  content.split('\n').forEach((text, i) => {
    if (re.test(text)) hits.push({ line: i + 1, text: text.trim() });
  });
  return hits;
}

export interface ResponseDoc {
  path: string; // repo-relative or absolute — used verbatim in findings
  content: string;
}

/** Numeric rate equality: '$75/hr' from either side compares by value. */
function rateValue(rate: string): number {
  return Number.parseFloat(rate.replace(/[^0-9.]/g, ''));
}

/**
 * Cross-check every person card against every response doc and assemble the
 * report. Report-only: findings are review aids, not auto-verdicts.
 */
export function assembleFindings(cards: PersonCard[], docs: ResponseDoc[]): RosterReport {
  const people: PersonFindings[] = [];
  const counts = { statusFlags: 0, rateMismatches: 0, unverifiedReminders: 0 };

  for (const card of cards) {
    const mentions: DocMention[] = [];
    for (const doc of docs) {
      for (const hit of findNameMentions(card.name, doc.content)) {
        mentions.push({ file: doc.path, line: hit.line, text: hit.text });
      }
    }
    if (mentions.length === 0) continue;

    const statusFlags =
      card.status !== null && FLAGGED_STATUSES.includes(card.status) ? mentions : [];

    const cardValues = new Set(card.rates.map(rateValue));
    const rateMismatches: RateMismatch[] = [];
    for (const mention of mentions) {
      const docRates = extractRates(mention.text).filter((r) => !cardValues.has(rateValue(r)));
      if (docRates.length > 0) {
        rateMismatches.push({ ...mention, docRates, cardRates: card.rates });
      }
    }

    const unverifiedReminder: UnverifiedReminder | null =
      card.unverifiedLines.length > 0
        ? {
            files: [...new Set(mentions.map((m) => m.file))],
            mentionCount: mentions.length,
            unverifiedLines: card.unverifiedLines,
          }
        : null;

    if (statusFlags.length === 0 && rateMismatches.length === 0 && !unverifiedReminder) continue;

    counts.statusFlags += statusFlags.length;
    counts.rateMismatches += rateMismatches.length;
    if (unverifiedReminder) counts.unverifiedReminders += 1;

    people.push({
      name: card.name,
      status: card.status,
      statusFlags,
      rateMismatches,
      unverifiedReminder,
    });
  }

  return { people, counts };
}
