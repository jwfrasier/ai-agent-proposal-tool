import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  assembleFindings,
  detectStatus,
  extractRates,
  findNameMentions,
  nameFromFileName,
  parsePersonCard,
  type PersonCard,
} from '../../lib/roster/check';

describe('nameFromFileName', () => {
  it('title-cases hyphenated slugs', () => {
    expect(nameFromFileName('kenneth-benavides.md')).toBe('Kenneth Benavides');
    expect(nameFromFileName('rida-khazi.md')).toBe('Rida Khazi');
  });
});

describe('extractRates', () => {
  it('extracts the rate formats seen on real cards', () => {
    expect(extractRates('**Rate (1099 cost, per Joseph 8/11):** $50/hr')).toEqual(['$50/hr']);
    expect(extractRates('rate **$65/hr (1099)** · availability moonlight')).toEqual(['$65/hr']);
    expect(extractRates('billed at $72.50/hour blended')).toEqual(['$72.5/hr']);
    expect(extractRates('$50 / hr with spaces')).toEqual(['$50/hr']);
  });

  it('collects multiple figures, dedupes, ignores non-hourly dollars', () => {
    const text =
      'countered $200/hr; that is ~$225/hr effective; basis $125/hr × 450 hrs = $56,250; again $200/hr';
    expect(extractRates(text)).toEqual(['$200/hr', '$225/hr', '$125/hr']);
    expect(extractRates('a $198k bid and $2M total')).toEqual([]);
  });
});

describe('detectStatus', () => {
  it('earliest token wins so "bench (no active-bid assignment)" is bench', () => {
    expect(detectStatus('bench (no active-bid assignment)')).toBe('bench');
    expect(detectStatus('active-bid (pending 2 confirmations)')).toBe('active-bid');
  });

  it('handles decorated reference-POC and do-not-use lines', () => {
    expect(detectStatus('⛔ **reference-POC — DO NOT propose on any bid team**')).toBe(
      'reference-POC'
    );
    expect(detectStatus('do-not-use — left the industry')).toBe('do-not-use');
  });

  it('returns null when no known token is present', () => {
    expect(detectStatus('some freeform note')).toBeNull();
  });
});

const REFERENCE_CARD = `# Ethan Gula

- **Status:** ⛔ **reference-POC — DO NOT propose on any bid team** (decided by Joseph
  2026-08-10; removed from DoWEA roster same day)
- **Why:** he is the customer-side contact.
- **Rate: $75/hr (1099) — CONFIRMED by Joseph 2026-08-13** (post-8/31 only).
`;

const UNVERIFIED_CARD = `# Kenneth Benavides [surname spelling unverified]

- **Status:** prospect — REMOVED from DoWEA roster 2026-08-10.
- **Profile (LinkedIn-sourced, UNVERIFIED):** fractional technology delivery leader;
- **Missing:** rate; citizenship.
`;

describe('parsePersonCard', () => {
  it('parses a reference-POC card: name, status across bold/emoji, rates', () => {
    const card = parsePersonCard('ethan-gula.md', REFERENCE_CARD);
    expect(card.name).toBe('Ethan Gula');
    expect(card.status).toBe('reference-POC');
    expect(card.rates).toEqual(['$75/hr']);
    expect(card.unverifiedLines).toEqual([]);
  });

  it('strips bracketed asides from the H1 and captures UNVERIFIED lines', () => {
    const card = parsePersonCard('kenneth-benavides.md', UNVERIFIED_CARD);
    expect(card.name).toBe('Kenneth Benavides');
    expect(card.status).toBe('prospect');
    expect(card.rates).toEqual([]);
    expect(card.unverifiedLines).toHaveLength(1);
    expect(card.unverifiedLines[0].line).toBe(4);
    expect(card.unverifiedLines[0].text).toContain('UNVERIFIED');
  });

  it('falls back to the filename when there is no usable H1', () => {
    const card = parsePersonCard('rida-khazi.md', '- **Status:** active-bid\n');
    expect(card.name).toBe('Rida Khazi');
    expect(card.status).toBe('active-bid');
  });

  it('UNVERIFIED matching is case-sensitive (marker, not the casual word)', () => {
    const card = parsePersonCard('a-b.md', '# A B\n\n- note: unverified rumor\n');
    expect(card.unverifiedLines).toEqual([]);
  });
});

describe('findNameMentions', () => {
  it('matches case-insensitively with line numbers, full name only', () => {
    const doc = [
      'Team lead: ETHAN GULA will verify.', // 1
      'Frasier Digital LLC overview.', // 2 — surname alone must not match
      'Contact ethan gula at esc4.', // 3
      'Ethan Gulash is someone else.', // 4 — boundary check
    ].join('\n');
    const hits = findNameMentions('Ethan Gula', doc);
    expect(hits.map((h) => h.line)).toEqual([1, 3]);
  });

  it('tolerates multiple spaces between name parts', () => {
    expect(findNameMentions('Ethan Gula', 'per  Ethan  Gula today')).toHaveLength(1);
  });
});

describe('assembleFindings', () => {
  const cards: PersonCard[] = [
    parsePersonCard('ethan-gula.md', REFERENCE_CARD),
    parsePersonCard('kenneth-benavides.md', UNVERIFIED_CARD),
    parsePersonCard(
      'alan-hong.md',
      '# Alan Hong\n\n- **Status:** active-bid\n- **Rate: $75/hr (1099)**\n'
    ),
  ];

  it('flags reference-POC mentions, rate mismatches, and UNVERIFIED reminders', () => {
    const docs = [
      {
        path: 'docs/responses/x/team.md',
        content: [
          '## Staffing',
          'Ethan Gula — Simulation Lead at $85/hr.', // status flag + rate mismatch
          'Alan Hong — Sr Data Analyst at $75/hr.', // rate matches card: no finding
          'Kenneth Benavides supports delivery.', // UNVERIFIED reminder
        ].join('\n'),
      },
    ];
    const report = assembleFindings(cards, docs);

    expect(report.counts).toEqual({ statusFlags: 1, rateMismatches: 1, unverifiedReminders: 1 });

    const ethan = report.people.find((p) => p.name === 'Ethan Gula')!;
    expect(ethan.statusFlags).toHaveLength(1);
    expect(ethan.statusFlags[0]).toMatchObject({ file: 'docs/responses/x/team.md', line: 2 });
    expect(ethan.rateMismatches[0]).toMatchObject({
      docRates: ['$85/hr'],
      cardRates: ['$75/hr'],
      line: 2,
    });

    const kenneth = report.people.find((p) => p.name === 'Kenneth Benavides')!;
    expect(kenneth.statusFlags).toEqual([]);
    expect(kenneth.unverifiedReminder).toMatchObject({
      files: ['docs/responses/x/team.md'],
      mentionCount: 1,
    });

    // Alan matches his card rate → no findings at all, so he is not in the report
    expect(report.people.find((p) => p.name === 'Alan Hong')).toBeUndefined();
  });

  it('a rate on a line naming a person with NO card rate is a mismatch', () => {
    const noRateCard = parsePersonCard('jo-fr.md', '# Jo Fr\n\n- **Status:** principal\n');
    const report = assembleFindings(
      [noRateCard],
      [{ path: 'r.md', content: 'Jo Fr billed at $150/hr' }]
    );
    expect(report.counts.rateMismatches).toBe(1);
    expect(report.people[0].rateMismatches[0].cardRates).toEqual([]);
  });

  it('people never mentioned in response docs produce no findings', () => {
    const report = assembleFindings(cards, [{ path: 'r.md', content: 'nothing relevant' }]);
    expect(report.people).toEqual([]);
    expect(report.counts).toEqual({ statusFlags: 0, rateMismatches: 0, unverifiedReminders: 0 });
  });
});

describe('real-world card parsing', () => {
  it('parses the real docs/people/joseph-frasier.md', () => {
    const path = join(__dirname, '..', '..', 'docs', 'people', 'joseph-frasier.md');
    const card = parsePersonCard('joseph-frasier.md', readFileSync(path, 'utf8'));
    expect(card.name).toBe('Joseph Frasier');
    expect(card.status).toBe('principal');
    expect(card.statusText).toContain('Founder');
    // sanity: parsing produced arrays, not crashes, on real prose
    expect(Array.isArray(card.rates)).toBe(true);
    expect(Array.isArray(card.unverifiedLines)).toBe(true);
  });
});
