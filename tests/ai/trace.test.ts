import { describe, it, expect, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { writeTrace, type TraceEntry } from '@/lib/ai/trace';

const baseEntry: TraceEntry = {
  traceId: 'test-trace-abc123',
  label: 'test:label',
  model: 'claude-sonnet-4-6',
  system: 'You are a test assistant.',
  userPrompt: 'Score this opportunity.',
  rawResponse: { content: [], usage: { input_tokens: 100, output_tokens: 50 } },
  toolInput: { fit_score: 75, recommendation: 'MAYBE' },
  validation: 'pass',
  tierDowngraded: false,
  promptTokens: 100,
  completionTokens: 50,
  costUsd: 0.001,
  durationMs: 432,
  createdAt: new Date().toISOString(),
};

// Track dirs created per-test for cleanup.
const dirsToClean: string[] = [];
afterEach(() => {
  delete process.env['TRACE_DIR'];
  for (const d of dirsToClean.splice(0)) {
    try { fs.rmSync(d, { recursive: true }); } catch { /* ignore */ }
  }
});

describe('writeTrace', () => {
  it('writes a JSON file to TRACE_DIR and the content is valid JSON matching the entry', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'trace-test-'));
    dirsToClean.push(tmpDir);
    process.env['TRACE_DIR'] = tmpDir;

    writeTrace(baseEntry);

    const filePath = path.join(tmpDir, `${baseEntry.traceId}.json`);
    expect(fs.existsSync(filePath)).toBe(true);

    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as TraceEntry;
    expect(parsed.traceId).toBe(baseEntry.traceId);
    expect(parsed.label).toBe(baseEntry.label);
    expect(parsed.model).toBe(baseEntry.model);
    expect(parsed.validation).toBe('pass');
    expect(parsed.promptTokens).toBe(100);
    expect(parsed.completionTokens).toBe(50);
  });

  it('creates nested directories if TRACE_DIR does not exist', () => {
    const tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), 'trace-mkdir-'));
    dirsToClean.push(tmpBase);
    const nestedDir = path.join(tmpBase, 'nested', 'deep', 'traces');
    process.env['TRACE_DIR'] = nestedDir;

    const entry = { ...baseEntry, traceId: 'mkdir-test-id' };
    writeTrace(entry);

    expect(fs.existsSync(path.join(nestedDir, 'mkdir-test-id.json'))).toBe(true);
  });

  it('does not throw when TRACE_DIR is an invalid/unwritable path', () => {
    process.env['TRACE_DIR'] = '/nonexistent/deeply/invalid/path/xyz_abc_999';
    // Should silently swallow any I/O error.
    expect(() => writeTrace(baseEntry)).not.toThrow();
  });

  it('writes a fail-validation entry correctly', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'trace-fail-'));
    dirsToClean.push(tmpDir);
    process.env['TRACE_DIR'] = tmpDir;

    const failEntry: TraceEntry = {
      ...baseEntry,
      traceId: 'fail-trace-id',
      validation: 'fail',
      tierDowngraded: true,
      model: '',
      rawResponse: null,
      toolInput: null,
      promptTokens: 0,
      completionTokens: 0,
      costUsd: 0,
      durationMs: 0,
    };

    writeTrace(failEntry);

    const parsed = JSON.parse(
      fs.readFileSync(path.join(tmpDir, 'fail-trace-id.json'), 'utf-8'),
    ) as TraceEntry;
    expect(parsed.validation).toBe('fail');
    expect(parsed.tierDowngraded).toBe(true);
  });
});
