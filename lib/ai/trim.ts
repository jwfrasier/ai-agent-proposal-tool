// Pure helper: normalize an opportunity description before sending it to a model.
// Strips HTML, decodes a few common entities, collapses whitespace, and truncates.
// Used for BOTH the cheap triage call and the Sonnet score input, so the dominant
// (input) token cost is paid on clean, bounded text.

const DEFAULT_MAX_CHARS = 6000;

export function trimForScoring(
  text: string | null | undefined,
  maxChars: number = DEFAULT_MAX_CHARS,
): string {
  if (!text) return '';
  let s = text
    .replace(/<[^>]+>/g, ' ')      // strip HTML tags
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')          // collapse all whitespace runs
    .trim();
  if (s.length > maxChars) {
    s = s.slice(0, maxChars).trimEnd() + '…';
  }
  return s;
}
