import fs from 'node:fs';
import path from 'node:path';

export interface TraceEntry {
  traceId: string;
  label: string;
  model: string;
  system: string;
  userPrompt: string;
  rawResponse: unknown;
  toolInput: unknown;
  validation: 'pass' | 'fail';
  tierDowngraded: boolean;
  promptTokens: number;
  completionTokens: number;
  costUsd: number;
  durationMs: number;
  createdAt: string; // ISO
}

/**
 * Best-effort: writes JSON to `${TRACE_DIR}/${traceId}.json`.
 * MUST NOT throw — all I/O errors are silently swallowed.
 */
export function writeTrace(entry: TraceEntry): void {
  try {
    const dir = process.env['TRACE_DIR'] ?? './data/traces';
    fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, `${entry.traceId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(entry, null, 2));
  } catch {
    // Best-effort: never propagate I/O errors to callers.
  }
}
