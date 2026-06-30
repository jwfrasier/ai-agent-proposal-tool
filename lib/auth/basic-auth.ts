/**
 * Edge-runtime-safe Basic Auth helpers.
 * No Node built-ins — uses only `atob` and Web APIs.
 */

export interface BasicAuthCredentials {
  user: string;
  pass: string;
}

/**
 * Parses an HTTP `Authorization: Basic <base64>` header.
 * Returns null if the header is missing, malformed, or not Basic-scheme.
 */
export function parseBasicAuth(header: string | null): BasicAuthCredentials | null {
  if (!header) return null;

  const prefix = 'Basic ';
  if (!header.startsWith(prefix)) return null;

  const encoded = header.slice(prefix.length).trim();
  if (!encoded) return null;

  let decoded: string;
  try {
    decoded = atob(encoded);
  } catch {
    return null;
  }

  const colonIdx = decoded.indexOf(':');
  if (colonIdx === -1) return null;

  return {
    user: decoded.slice(0, colonIdx),
    pass: decoded.slice(colonIdx + 1),
  };
}

/**
 * Constant-time string equality to prevent timing attacks.
 * Always iterates over the full length of the longer string,
 * XOR-accumulating differences so the total time is independent
 * of how early a mismatch occurs.
 */
export function timingSafeEqualStr(a: string, b: string): boolean {
  const maxLen = Math.max(a.length, b.length);
  let diff = a.length ^ b.length; // non-zero if lengths differ

  for (let i = 0; i < maxLen; i++) {
    // Use 0 for out-of-range chars so we always do the same number of ops
    const ca = i < a.length ? a.charCodeAt(i) : 0;
    const cb = i < b.length ? b.charCodeAt(i) : 0;
    diff |= ca ^ cb;
  }

  return diff === 0;
}
