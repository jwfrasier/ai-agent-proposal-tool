import { config } from '../config';
import { log } from '../log';
import { SamSearchResponseSchema, type SamSearchResponse } from './schemas';

const SAM_BASE = 'https://api.sam.gov';
const ALLOWED_HOSTS = new Set(['api.sam.gov']);

const MAX_RETRIES = 3;
const BASE_BACKOFF_MS = 500;

function buildUrl(
  pathOrUrl: string,
  query: Record<string, string | number | undefined>,
): URL {
  const url = pathOrUrl.startsWith('http')
    ? new URL(pathOrUrl)
    : new URL(pathOrUrl, SAM_BASE);
  if (!ALLOWED_HOSTS.has(url.host)) {
    throw new Error(`Disallowed host: ${url.host}`);
  }
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  }
  return url;
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function samFetch(
  pathOrUrl: string,
  query: Record<string, string | number | undefined>,
): Promise<unknown> {
  const url = buildUrl(pathOrUrl, query);
  let lastErr: unknown;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(url, {
      headers: {
        'X-Api-Key': config.samGovApiKey,
        accept: 'application/json',
      },
    });
    if (res.ok) {
      return res.json();
    }
    if (res.status === 429 || res.status >= 500) {
      const backoff = BASE_BACKOFF_MS * 2 ** (attempt - 1);
      log.warn({ status: res.status, attempt, backoff }, 'SAM retry');
      lastErr = new Error(`SAM ${res.status}`);
      await sleep(backoff);
      continue;
    }
    const body = await res.text().catch(() => '');
    throw new Error(`SAM ${res.status}: ${body.slice(0, 200)}`);
  }
  throw new Error(`SAM request failed after ${MAX_RETRIES} attempts: ${String(lastErr)}`);
}

export async function samSearch(query: {
  naics: string;
  postedFrom?: string;
  postedTo?: string;
  limit?: number;
  offset?: number;
}): Promise<SamSearchResponse> {
  const raw = await samFetch('/opportunities/v2/search', {
    api_version: 'v2',
    ncode: query.naics,
    postedFrom: query.postedFrom,
    postedTo: query.postedTo,
    limit: query.limit ?? 25,
    offset: query.offset ?? 0,
  });
  const parsed = SamSearchResponseSchema.safeParse(raw);
  if (!parsed.success) {
    log.error({ issues: parsed.error.issues }, 'SAM response shape mismatch');
    throw new Error('Invalid SAM response shape');
  }
  return parsed.data;
}
