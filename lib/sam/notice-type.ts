// SAM.gov `type` values that are NOT live, biddable solicitations. Award notices and
// J&A (Justification) notices announce or justify a decision that has already been made —
// scoring them as opportunities wastes a model call and produces misleading recommendations.
const NON_BIDDABLE_TYPES = new Set<string>([
  'Award Notice',
  'Justification',
  'Intent to Bundle Requirements (DoD-Funded)',
]);

/**
 * True when a SAM notice type is something a vendor can still respond to or bid on
 * (Solicitation, Combined Synopsis/Solicitation, Presolicitation, Sources Sought, Special Notice).
 * Unknown/missing types default to biddable so we never silently drop real opportunities.
 */
export function isBiddableNoticeType(type: string | null | undefined): boolean {
  if (!type) return true;
  return !NON_BIDDABLE_TYPES.has(type);
}

/** Reads the raw SAM `type` off a stored opportunity's rawJson. */
export function noticeTypeOf(rawJson: unknown): string | null {
  if (rawJson && typeof rawJson === 'object' && 'type' in rawJson) {
    const t = (rawJson as { type: unknown }).type;
    return typeof t === 'string' ? t : null;
  }
  return null;
}
