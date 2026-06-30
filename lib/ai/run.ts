import { randomUUID } from 'node:crypto';
import Anthropic from '@anthropic-ai/sdk';
import { anthropic, costFor, MODEL_CHAIN } from './client';
import { writeTrace } from './trace';

export interface RunStructuredOpts<T> {
  system: string;
  userContent: string;          // already-assembled user message text
  toolName: string;
  toolDescription: string;
  jsonSchema: unknown;          // Anthropic tool input_schema (JSON Schema object)
  parse: (input: unknown) => T; // e.g. a zod schema's parse — throws on mismatch
  label: string;                // trace label, e.g. "score:opp-123"
  maxTokens?: number;           // default 1500
}

export interface RunStructuredResult<T> {
  value: T;
  model: string;
  promptTokens: number;
  completionTokens: number;
  costUsd: number;
  tierDowngraded: boolean;
  traceId: string;
}

/**
 * Returns true for rate-limit and server-error responses that warrant trying
 * the next model in the chain rather than failing or retrying the same model.
 */
function isTransientError(err: unknown): boolean {
  // Duck-type check: works for real Anthropic.APIError instances and test mocks alike.
  if (err != null && typeof err === 'object' && 'status' in err) {
    const status = (err as { status: number }).status;
    return status >= 500 || status === 429;
  }
  return false;
}

function findToolUse(
  content: Anthropic.Message['content'],
  toolName: string,
): Anthropic.ToolUseBlock | undefined {
  return content.find(
    (c): c is Anthropic.ToolUseBlock => c.type === 'tool_use' && c.name === toolName,
  );
}

/**
 * Generalized structured-output runner with model tier-fallback and trace writing.
 *
 * Iterates MODEL_CHAIN in order. For each model:
 *   - Forces a single tool call (tool_choice: { type: 'tool', name }).
 *   - On validation failure (no tool_use block or parse throws), retries ONCE on the
 *     same model with a corrective multi-turn conversation.
 *   - On transient API failure (429 / 5xx), moves to the next model.
 *   - On success, writes a 'pass' trace and returns.
 *
 * Throws if all models are exhausted, after writing a 'fail' trace.
 */
export async function runStructured<T>(opts: RunStructuredOpts<T>): Promise<RunStructuredResult<T>> {
  const traceId = randomUUID();
  let lastError: unknown = new Error('MODEL_CHAIN is empty');

  const tools: Anthropic.Tool[] = [
    {
      name: opts.toolName,
      description: opts.toolDescription,
      input_schema: opts.jsonSchema as Anthropic.Tool['input_schema'],
    },
  ];
  const toolChoice = { type: 'tool' as const, name: opts.toolName };
  const baseMessages: Anthropic.MessageParam[] = [
    { role: 'user', content: opts.userContent },
  ];

  for (let i = 0; i < MODEL_CHAIN.length; i++) {
    const model = MODEL_CHAIN[i]!;
    const tierDowngraded = i > 0;
    const tStart = Date.now();

    // ── First attempt ────────────────────────────────────────────────────────
    let response: Anthropic.Message;
    try {
      response = await anthropic.messages.create({
        model,
        max_tokens: opts.maxTokens ?? 1500,
        system: opts.system,
        tools,
        tool_choice: toolChoice,
        messages: baseMessages,
      });
    } catch (err) {
      lastError = err;
      continue; // transient or unexpected API error — try next model
    }

    const toolUse = findToolUse(response.content, opts.toolName);

    // ── Validation: extract and parse ────────────────────────────────────────
    let parseError: unknown;
    if (toolUse) {
      try {
        const value = opts.parse(toolUse.input);
        return emitPass(traceId, opts, response, value, tierDowngraded, tStart);
      } catch (err) {
        parseError = err;
      }
    } else {
      parseError = new Error(`Anthropic response missing ${opts.toolName} tool_use block`);
    }

    // ── Same-model retry with corrective turn ────────────────────────────────
    const errMsg = parseError instanceof Error ? parseError.message : String(parseError);

    let retryMessages: Anthropic.MessageParam[];
    if (toolUse) {
      // Previous assistant response contained a tool_use block: include tool_result.
      retryMessages = [
        ...baseMessages,
        { role: 'assistant' as const, content: response.content as Anthropic.ContentBlockParam[] },
        {
          role: 'user' as const,
          content: [
            {
              type: 'tool_result' as const,
              tool_use_id: toolUse.id,
              is_error: true,
              content: errMsg,
            },
            {
              type: 'text' as const,
              text: `Your previous output was invalid: ${errMsg}. Call the tool again with corrected input.`,
            },
          ],
        },
      ];
    } else {
      // No tool_use in previous response: plain corrective user message.
      retryMessages = [
        ...baseMessages,
        { role: 'assistant' as const, content: response.content as Anthropic.ContentBlockParam[] },
        {
          role: 'user' as const,
          content: `Your previous output was invalid: ${errMsg}. Call the tool again with corrected input.`,
        },
      ];
    }

    let retryResponse: Anthropic.Message;
    try {
      retryResponse = await anthropic.messages.create({
        model,
        max_tokens: opts.maxTokens ?? 1500,
        system: opts.system,
        tools,
        tool_choice: toolChoice,
        messages: retryMessages,
      });
    } catch (err) {
      lastError = err;
      continue; // API failure on retry — try next model
    }

    const retryToolUse = findToolUse(retryResponse.content, opts.toolName);
    if (!retryToolUse) {
      lastError = new Error(
        `Anthropic response missing ${opts.toolName} tool_use block on retry`,
      );
      continue;
    }

    try {
      const value = opts.parse(retryToolUse.input);
      return emitPass(traceId, opts, retryResponse, value, tierDowngraded, tStart);
    } catch (err) {
      lastError = err;
      continue; // still failing — try next model
    }
  }

  // ── All models exhausted ─────────────────────────────────────────────────
  writeTrace({
    traceId,
    label: opts.label,
    model: '',
    system: opts.system,
    userPrompt: opts.userContent,
    rawResponse: null,
    toolInput: null,
    validation: 'fail',
    tierDowngraded: MODEL_CHAIN.length > 1,
    promptTokens: 0,
    completionTokens: 0,
    costUsd: 0,
    durationMs: 0,
    createdAt: new Date().toISOString(),
  });

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

function emitPass<T>(
  traceId: string,
  opts: RunStructuredOpts<T>,
  response: Anthropic.Message,
  value: T,
  tierDowngraded: boolean,
  tStart: number,
): RunStructuredResult<T> {
  const durationMs = Date.now() - tStart;
  const promptTokens = response.usage.input_tokens;
  const completionTokens = response.usage.output_tokens;
  const costUsd = costFor(response.model, promptTokens, completionTokens);

  writeTrace({
    traceId,
    label: opts.label,
    model: response.model,
    system: opts.system,
    userPrompt: opts.userContent,
    rawResponse: response,
    toolInput: value,
    validation: 'pass',
    tierDowngraded,
    promptTokens,
    completionTokens,
    costUsd,
    durationMs,
    createdAt: new Date().toISOString(),
  });

  return { value, model: response.model, promptTokens, completionTokens, costUsd, tierDowngraded, traceId };
}
