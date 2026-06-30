// Deterministic, explainable pre-screen for federal opportunities.
//
// Encodes the patterns we learned the hard way reading real solicitations:
//  - Justification / Award notices are already-decided (not biddable).
//  - Brand-name / sole-source language means the award destination is predetermined.
//  - Commodity license / subscription buys are product purchases, not services.
//  - "Named COTS product, configured not built" RFIs are a product play (sub-only for us).
//  - Obvious non-IT scope is out of lane.
//
// Every signal cites the exact matched text so a human (and the UI/CLI) can see WHY.

export type ScreenCategory =
  | 'already_decided'
  | 'brand_name_sole_source'
  | 'commodity_license'
  | 'product_rfi'
  | 'out_of_scope';

export type ScreenDisposition = 'auto_pass' | 'flag' | 'clear';

export interface ScreenSignal {
  category: ScreenCategory;
  rule: string;
  /** The exact phrase from the opportunity text that triggered this signal. */
  matched: string;
}

export interface ScreenResult {
  disposition: ScreenDisposition;
  /** The category that drove the disposition (most severe match), or null when clear. */
  category: ScreenCategory | null;
  reason: string;
  signals: ScreenSignal[];
}

export interface ScreenInput {
  noticeType?: string | null;
  title?: string | null;
  description?: string | null;
  setAside?: string | null;
}

// Categories that short-circuit to PASS without spending an AI call.
const AUTO_PASS_CATEGORIES = new Set<ScreenCategory>([
  'already_decided',
  'brand_name_sole_source',
  'commodity_license',
  'out_of_scope',
]);

const NON_BIDDABLE_NOTICE_TYPES = new Set(['Award Notice', 'Justification', 'Intent to Bundle Requirements (DoD-Funded)']);

interface Rule {
  category: ScreenCategory;
  label: string;
  pattern: RegExp;
}

// Ordered by severity; the first auto-pass match sets the headline category,
// but every matching rule contributes a cited signal.
const RULES: Rule[] = [
  // ── Brand-name / sole-source ────────────────────────────────────────────
  { category: 'brand_name_sole_source', label: 'Brand-name requirement', pattern: /\bbrand[\s-]?name\b/i },
  { category: 'brand_name_sole_source', label: 'Sole-source', pattern: /\bsole[\s-]?source\b/i },
  { category: 'brand_name_sole_source', label: 'Only responsible source', pattern: /only one responsible source|the only (tool|source|vendor|solution) that can/i },
  { category: 'brand_name_sole_source', label: 'Salient characteristics (brand-name marker)', pattern: /salient characteristics/i },
  { category: 'brand_name_sole_source', label: 'Reseller channel (Carahsoft)', pattern: /\bcarahsoft\b/i },
  { category: 'brand_name_sole_source', label: 'Manufactured-by / through-reseller', pattern: /manufactured by [A-Z][\w.&-]+(?:\s+through\s+[A-Z][\w.&-]+)?/ },

  // ── Commodity license / subscription buy ────────────────────────────────
  { category: 'commodity_license', label: 'Annual subscription buy', pattern: /\bannual subscription\b/i },
  { category: 'commodity_license', label: 'Limited / subscription license', pattern: /\b(limited license|subscription limited license|software license renewal|license renewal|maintenance renewal)\b/i },
  { category: 'commodity_license', label: 'Manufacturer part number (catalog buy)', pattern: /\bpart\s*(number|no\.?|#)\b/i },

  // ── Out of lane (non-IT scope) ──────────────────────────────────────────
  { category: 'out_of_scope', label: 'Non-IT scope', pattern: /\b(janitorial|custodial|grounds maintenance|landscaping|food service|construction|roofing|hvac|plumbing|ammunition|weapon|firearm|pharmaceutical|medical suppl|glucometer|nurse call|mortuary|wastewater)\b/i },

  // ── Product RFI (gray — flag, do not auto-pass) ─────────────────────────
  { category: 'product_rfi', label: 'Configured, not custom-built', pattern: /configured without (excessive )?custom development|minimal custom development|not (require|need) custom development/i },
  { category: 'product_rfi', label: 'Named COTS / proven platform sought', pattern: /\b(commercial off[\s-]?the[\s-]?shelf|COTS|proven,? (named )?platform|named,? proven platform)\b/i },
];

function categoryReason(category: ScreenCategory): string {
  switch (category) {
    case 'already_decided':
      return 'Notice type indicates the decision is already made (justification or award notice) — not an open, biddable opportunity.';
    case 'brand_name_sole_source':
      return 'Brand-name / sole-source language signals the award destination is predetermined.';
    case 'commodity_license':
      return 'This is a commodity software license/subscription purchase, not a services or development opportunity.';
    case 'out_of_scope':
      return 'Scope is outside Frasier Digital’s IT/software lane.';
    case 'product_rfi':
      return 'Agency wants a proven named COTS product configured (not custom-built) — a product play; viable only as a subcontractor/integration partner.';
  }
}

export function screenOpportunity(input: ScreenInput): ScreenResult {
  const signals: ScreenSignal[] = [];
  const haystack = `${input.title ?? ''}\n${input.description ?? ''}`;

  if (input.noticeType && NON_BIDDABLE_NOTICE_TYPES.has(input.noticeType)) {
    signals.push({ category: 'already_decided', rule: `Notice type: ${input.noticeType}`, matched: input.noticeType });
  }

  for (const rule of RULES) {
    const m = rule.pattern.exec(haystack);
    if (m) {
      signals.push({ category: rule.category, rule: rule.label, matched: m[0].trim().slice(0, 120) });
    }
  }

  if (signals.length === 0) {
    return { disposition: 'clear', category: null, reason: 'No disqualifying patterns detected.', signals: [] };
  }

  // Headline category = the most severe (auto-pass) signal if any, else the first flag.
  const autoPassSignal = signals.find((s) => AUTO_PASS_CATEGORIES.has(s.category));
  const headline = (autoPassSignal ?? signals[0]!).category;
  const disposition: ScreenDisposition = AUTO_PASS_CATEGORIES.has(headline) ? 'auto_pass' : 'flag';

  return { disposition, category: headline, reason: categoryReason(headline), signals };
}
