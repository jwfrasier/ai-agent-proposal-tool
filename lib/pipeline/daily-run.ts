import { eq, desc, and, ne } from 'drizzle-orm';
import type { DB } from '../db/client';
import * as schema from '../db/schema';
import { searchByProfile } from '../sam/search';
import { fetchSamDescription } from '../sam/client';
import { isBiddableNoticeType, noticeTypeOf } from '../sam/notice-type';
import { screenOpportunity, type ScreenResult } from '../screening/screen';
import { scoreOpportunity } from '../ai/score';
import { triageOpportunity } from '../ai/triage';
import type { TriageOutput } from '../ai/triage';
import { rankCandidates } from './heuristic';
import { log as rootLog } from '../log';
import type { SamOpportunityRaw } from '../sam/schemas';

type LogFn = (level: 'info' | 'warn' | 'error', msg: string, ctx?: unknown) => void;

// Model tag for the zero-cost marker written when a description could not be fetched.
// Such rows are excluded from every "already scored" check so the opp retries next run.
export const DESC_FETCH_FAILED_MODEL = 'desc_fetch_failed';

// SAM's search API returns `description` as a URL to a separate endpoint, not the text itself.
// Resolve it to the real description (once) before scoring, and persist so we never re-fetch.
// If the fetch fails, retry once immediately; if it still fails, report `descFailed` so the
// caller skips AI spend — scoring on metadata alone produces unreliable results.
async function resolveDescription(
  db: DB,
  opp: schema.Opportunity,
  log: LogFn,
): Promise<{ opp: schema.Opportunity; descFailed: boolean }> {
  const desc = opp.description ?? '';
  if (!desc.startsWith('https://api.sam.gov')) return { opp, descFailed: false };
  let resolved = await fetchSamDescription(desc);
  if (!resolved) {
    log('warn', 'Description URL did not resolve; retrying once', { noticeId: opp.noticeId });
    resolved = await fetchSamDescription(desc);
  }
  if (!resolved) {
    log('warn', 'Description URL did not resolve after retry; skipping AI for this opportunity', {
      noticeId: opp.noticeId,
    });
    return { opp, descFailed: true };
  }
  db.update(schema.opportunities)
    .set({ description: resolved })
    .where(eq(schema.opportunities.noticeId, opp.noticeId))
    .run();
  return { opp: { ...opp, description: resolved }, descFailed: false };
}

// Synthetic score for an opportunity the deterministic pre-screen auto-passed.
// Records the PASS + cited signals as a real scores row, with no AI cost.
function screenedOutScore(
  opportunityId: string,
  profileVersion: number,
  screen: ScreenResult,
): schema.NewScore {
  const note = { matched: false, reason: screen.reason };
  return {
    opportunityId,
    profileVersion,
    fitScore: 0,
    recommendation: 'NO_GO',
    naicsMatch: note,
    capabilityMatch: note,
    setasideMatch: note,
    keyRequirements: [],
    risks: screen.signals.map((s) => `${s.rule}: "${s.matched}"`),
    winThemes: [],
    confidence: 0.99,
    confidenceReason: screen.reason,
    ambiguity: 'none',
    model: `screen:${screen.category}`,
    promptTokens: 0,
    completionTokens: 0,
    costUsd: 0,
    createdAt: new Date(),
  };
}

function solicitationNumberOf(rawJson: unknown): string | null {
  if (rawJson && typeof rawJson === 'object' && 'solicitationNumber' in rawJson) {
    const v = (rawJson as { solicitationNumber?: unknown }).solicitationNumber;
    if (typeof v === 'string' && v.trim().length > 0) return v.trim();
  }
  return null;
}

// Zero-cost marker row: this opportunity is a repost of an already-scored solicitation.
function dupMarkerScore(
  opportunityId: string,
  profileVersion: number,
  solNum: string,
): schema.NewScore {
  const note = { matched: false, reason: `Duplicate solicitation ${solNum} already scored this profile version.` };
  return {
    opportunityId,
    profileVersion,
    fitScore: 0,
    recommendation: 'NO_GO',
    naicsMatch: note,
    capabilityMatch: note,
    setasideMatch: note,
    keyRequirements: [],
    risks: [`duplicate_solicitation: "${solNum}"`],
    winThemes: [],
    confidence: 0.99,
    confidenceReason: note.reason,
    ambiguity: 'none',
    model: `dup:${solNum}`,
    promptTokens: 0,
    completionTokens: 0,
    costUsd: 0,
    createdAt: new Date(),
  };
}

// Zero-cost marker row: this opportunity's description could not be fetched, so no AI was
// spent on it. Unlike the other markers, this one must NOT count as "already scored" —
// the pipeline excludes it from the skip checks so the opportunity retries next run.
function descFetchFailedMarkerScore(
  opportunityId: string,
  profileVersion: number,
): schema.NewScore {
  const note = {
    matched: false,
    reason: 'Description fetch failed after retry; AI scoring skipped. Will re-attempt on the next run.',
  };
  return {
    opportunityId,
    profileVersion,
    fitScore: 0,
    recommendation: 'NO_GO',
    naicsMatch: note,
    capabilityMatch: note,
    setasideMatch: note,
    keyRequirements: [],
    risks: ['desc_fetch_failed: description unavailable, not scored'],
    winThemes: [],
    confidence: 0,
    confidenceReason: note.reason,
    ambiguity: 'none',
    model: DESC_FETCH_FAILED_MODEL,
    promptTokens: 0,
    completionTokens: 0,
    costUsd: 0,
    createdAt: new Date(),
  };
}

// Remove stale desc_fetch_failed markers for an opportunity so a real score (or a fresh
// marker) supersedes them instead of accumulating one row per failing run.
function clearDescFailMarkers(db: DB, opportunityId: string): void {
  db.delete(schema.scores)
    .where(and(
      eq(schema.scores.opportunityId, opportunityId),
      eq(schema.scores.model, DESC_FETCH_FAILED_MODEL),
    ))
    .run();
}

// Marker row for an opportunity the cheap Haiku triage rejected (no Sonnet spend).
function triageMarkerScore(
  opportunityId: string,
  profileVersion: number,
  triage: TriageOutput,
): schema.NewScore {
  const note = { matched: false, reason: triage.reason };
  return {
    opportunityId,
    profileVersion,
    fitScore: 0,
    recommendation: 'NO_GO',
    naicsMatch: note,
    capabilityMatch: note,
    setasideMatch: note,
    keyRequirements: [],
    risks: [`triage_reject: "${triage.reason}"`],
    winThemes: [],
    confidence: 0.9,
    confidenceReason: triage.reason,
    ambiguity: 'none',
    model: 'triage:haiku',
    promptTokens: triage.promptTokens,
    completionTokens: triage.completionTokens,
    costUsd: triage.costUsd,
    createdAt: new Date(),
  };
}

export interface RunDailyArgs {
  db: DB;
  costCapUsd: number;
  topN?: number;
  postedFromOverride?: string;
  triageOnly?: boolean; // run Layers 1-2 only; skip Sonnet, report projected cost
}

export interface RunSummary {
  cronRunId: number;
  status: 'ok' | 'partial' | 'failed';
  oppsFetched: number;
  oppsNew: number;
  oppsScored: number;
  totalCostUsd: number;
  errorSummary: string | null;
  triageAdvanced: number;
  projectedSonnetCostUsd: number;
  descFetchFailed: number;
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function mapSamToInsert(raw: SamOpportunityRaw, now: Date): schema.NewOpportunity {
  const pop = raw.placeOfPerformance ?? null;
  const popStr = pop ? [pop.city?.name, pop.state?.code].filter(Boolean).join(', ') : null;
  return {
    noticeId: raw.noticeId,
    rawJson: raw as unknown as Record<string, unknown>,
    title: raw.title,
    agency: raw.fullParentPathName ?? '',
    naics: raw.naicsCode ?? null,
    setAside: raw.typeOfSetAsideDescription ?? null,
    postedAt: raw.postedDate ? new Date(raw.postedDate) : null,
    responseDeadline: raw.responseDeadLine ? new Date(raw.responseDeadLine) : null,
    awardCeiling: raw.awardCeiling != null ? Math.round(Number(raw.awardCeiling)) : null,
    placeOfPerformance: popStr,
    description: raw.description ?? null,
    firstSeenAt: now,
    lastSyncedAt: now,
    status: 'new',
  };
}

export async function runDaily(args: RunDailyArgs): Promise<RunSummary> {
  const { db, costCapUsd, topN = 10, triageOnly = false } = args;
  const startedAt = new Date();
  const logs: Array<{ ts: number; level: string; msg: string; ctx?: unknown }> = [];
  const log = (level: 'info' | 'warn' | 'error', msg: string, ctx?: unknown) => {
    logs.push({ ts: Date.now(), level, msg, ctx });
    rootLog[level]({ ctx }, msg);
  };

  const cronRow = db
    .insert(schema.cronRuns)
    .values({ startedAt, status: 'running', costCapUsd, logs: [] })
    .returning()
    .get();
  const cronRunId = cronRow.id;

  let oppsFetched = 0;
  let oppsNew = 0;
  let oppsScored = 0;
  let totalCostUsd = 0;
  let status: RunSummary['status'] = 'ok';
  let errorSummary: string | null = null;
  let triageAdvanced = 0;
  let projectedSonnetCostUsd = 0;
  let descFetchFailed = 0;

  try {
    // Reap stale runs a prior crash left stuck at 'running' (single-machine invariant: only this run should be active).
    db.update(schema.cronRuns)
      .set({ status: 'failed', errorSummary: 'reaped: stale running run (process died before finalize)', finishedAt: new Date() })
      .where(and(eq(schema.cronRuns.status, 'running'), ne(schema.cronRuns.id, cronRunId)))
      .run();

    const profile = db.select().from(schema.companyProfile).where(eq(schema.companyProfile.id, 1)).get();
    if (!profile) throw new Error('No company profile configured');

    const recentSonnet = db
      .select({ c: schema.scores.costUsd })
      .from(schema.scores)
      .where(eq(schema.scores.model, 'claude-sonnet-4-6'))
      .orderBy(desc(schema.scores.createdAt))
      .limit(50)
      .all();
    const avgSonnetCost = recentSonnet.length
      ? recentSonnet.reduce((s, r) => s + r.c, 0) / recentSonnet.length
      : 0.0203;

    const lastSuccess = db
      .select()
      .from(schema.cronRuns)
      .where(eq(schema.cronRuns.status, 'ok'))
      .orderBy(desc(schema.cronRuns.finishedAt))
      .limit(1)
      .get();

    const postedFrom = args.postedFromOverride
      ?? (lastSuccess?.finishedAt
        ? ymd(new Date(lastSuccess.finishedAt.getTime()))
        : ymd(new Date(Date.now() - 7 * 86400_000)));

    const postedTo = ymd(new Date());
    log('info', 'Searching SAM', { postedFrom, postedTo, naics: profile.naicsCodes });
    const samOpps = await searchByProfile({
      naicsCodes: profile.naicsCodes,
      postedFrom,
      postedTo,
      maxAwardCeiling: 350_000,
    });
    oppsFetched = samOpps.length;

    const now = new Date();
    for (const raw of samOpps) {
      const existing = db
        .select()
        .from(schema.opportunities)
        .where(eq(schema.opportunities.noticeId, raw.noticeId))
        .get();
      if (existing) {
        db.update(schema.opportunities)
          .set({
            lastSyncedAt: now,
            rawJson: raw as unknown as Record<string, unknown>,
            responseDeadline: raw.responseDeadLine
              ? new Date(raw.responseDeadLine)
              : existing.responseDeadline,
          })
          .where(eq(schema.opportunities.noticeId, raw.noticeId))
          .run();
      } else {
        db.insert(schema.opportunities).values(mapSamToInsert(raw, now)).run();
        oppsNew++;
      }
    }

    const allOpps = db.select().from(schema.opportunities).all();
    // desc_fetch_failed markers are excluded: they record a skipped (not scored) opportunity
    // and must not block a re-attempt on this run.
    const alreadyScoredIds = new Set(
      db
        .select({ id: schema.scores.opportunityId })
        .from(schema.scores)
        .where(and(
          eq(schema.scores.profileVersion, profile.version),
          ne(schema.scores.model, DESC_FETCH_FAILED_MODEL),
        ))
        .all()
        .map((r) => r.id),
    );
    // Solicitation numbers already scored at this profile version (dedup key beyond noticeId).
    const scoredSolNums = new Set<string>();
    for (const o of allOpps) {
      if (alreadyScoredIds.has(o.noticeId)) {
        const sn = solicitationNumberOf(o.rawJson);
        if (sn) scoredSolNums.add(sn);
      }
    }
    const eligible = allOpps.filter(
      (o) => !alreadyScoredIds.has(o.noticeId) && isBiddableNoticeType(noticeTypeOf(o.rawJson)),
    );
    const skippedNonBiddable = allOpps.filter(
      (o) => !alreadyScoredIds.has(o.noticeId) && !isBiddableNoticeType(noticeTypeOf(o.rawJson)),
    ).length;
    const ranked = rankCandidates(eligible, profile).slice(0, topN);
    log('info', 'Ranked candidates', {
      eligible: eligible.length,
      taking: ranked.length,
      skippedNonBiddable,
    });

    let lastCostUsd = 0;
    for (const opp of ranked) {
      if (totalCostUsd + lastCostUsd >= costCapUsd) {
        log('warn', 'Cost cap reached, stopping', { totalCostUsd, costCapUsd });
        status = 'partial';
        break;
      }
      const solNum = solicitationNumberOf(opp.rawJson);
      if (solNum && scoredSolNums.has(solNum)) {
        db.insert(schema.scores).values(dupMarkerScore(opp.noticeId, profile.version, solNum)).run();
        oppsScored++;
        log('info', 'Deduped repeated solicitation (no AI call)', { noticeId: opp.noticeId, solNum });
        continue;
      }
      try {
        const { opp: oppForScoring, descFailed } = await resolveDescription(db, opp, log);
        if (descFailed) {
          // No usable description -> AI scores would be metadata-only guesses. Skip all AI
          // spend and leave a zero-cost marker. The marker is excluded from the skip checks
          // above, so the opportunity is re-attempted on the next run. Refresh (not stack)
          // the marker, and do NOT add its solNum to scoredSolNums or count it as scored.
          clearDescFailMarkers(db, opp.noticeId);
          db.insert(schema.scores).values(descFetchFailedMarkerScore(opp.noticeId, profile.version)).run();
          descFetchFailed++;
          log('warn', 'Description unavailable; wrote desc_fetch_failed marker (no AI call, retry next run)', {
            noticeId: opp.noticeId,
          });
          continue;
        }
        // Description resolved: any marker left by a previous failing run is now superseded.
        clearDescFailMarkers(db, opp.noticeId);
        const screen = screenOpportunity({
          noticeType: noticeTypeOf(oppForScoring.rawJson),
          title: oppForScoring.title,
          description: oppForScoring.description,
          setAside: oppForScoring.setAside,
        });

        // Hybrid screening: auto-PASS the slam-dunks without spending an AI call.
        if (screen.disposition === 'auto_pass') {
          db.insert(schema.scores).values(screenedOutScore(opp.noticeId, profile.version, screen)).run();
          oppsScored++;
          // A same-run duplicate of this solicitation should hit the dedup guard, not repeat a paid call.
          if (solNum) scoredSolNums.add(solNum);
          log('info', 'Screened out (no AI call)', {
            noticeId: opp.noticeId,
            category: screen.category,
            matched: screen.signals[0]?.matched,
          });
          continue;
        }

        // Layer 2: cheap Haiku triage before the expensive Sonnet score.
        const triage = await triageOpportunity(oppForScoring, profile);
        totalCostUsd += triage.costUsd;
        if (triage.verdict === 'reject') {
          db.insert(schema.scores).values(triageMarkerScore(opp.noticeId, profile.version, triage)).run();
          oppsScored++;
          // A same-run duplicate of this solicitation should hit the dedup guard, not repeat a paid Haiku call.
          if (solNum) scoredSolNums.add(solNum);
          log('info', 'Triaged out (Haiku)', { noticeId: opp.noticeId, reason: triage.reason, costUsd: triage.costUsd });
          continue;
        }

        triageAdvanced++;
        if (triageOnly) {
          continue; // dry run: do not spend Sonnet
        }

        const scored = await scoreOpportunity(oppForScoring, profile, screen);
        db.insert(schema.scores).values({
          opportunityId: opp.noticeId,
          profileVersion: profile.version,
          fitScore: scored.fitScore,
          recommendation: scored.recommendation,
          naicsMatch: scored.naicsMatch,
          capabilityMatch: scored.capabilityMatch,
          setasideMatch: scored.setasideMatch,
          keyRequirements: scored.keyRequirements,
          risks: scored.risks,
          winThemes: scored.winThemes,
          confidence: scored.confidence,
          confidenceReason: scored.confidenceReason,
          ambiguity: scored.ambiguity,
          model: scored.model,
          promptTokens: scored.promptTokens,
          completionTokens: scored.completionTokens,
          costUsd: scored.costUsd,
          createdAt: new Date(),
        }).run();
        totalCostUsd += scored.costUsd;
        lastCostUsd = scored.costUsd;
        oppsScored++;
        if (solNum) scoredSolNums.add(solNum);
        log('info', 'Scored', {
          noticeId: opp.noticeId,
          fit: scored.fitScore,
          costUsd: scored.costUsd,
          confidence: scored.confidence,
          tierDowngraded: scored.tierDowngraded,
          traceId: scored.traceId,
        });
      } catch (err) {
        log('error', 'Scoring failed', { noticeId: opp.noticeId, err: String(err) });
        status = status === 'ok' ? 'partial' : status;
      }
    }

    if (descFetchFailed > 0) {
      log('warn', 'Run has partial data: opportunities skipped because their description fetch failed', {
        descFetchFailed,
      });
    }

    projectedSonnetCostUsd = triageOnly ? triageAdvanced * avgSonnetCost : 0;
    log('info', 'Cost projection', {
      triageAdvanced,
      avgSonnetCost,
      projectedSonnetCostUsd,
      note: triageOnly ? 'dry-run: Sonnet not spent' : 'full run',
    });
  } catch (err) {
    status = 'failed';
    errorSummary = String(err);
    log('error', 'Run failed', { err: errorSummary });
  } finally {
    const finishedAt = new Date();
    db.update(schema.cronRuns)
      .set({
        finishedAt,
        status,
        oppsFetched,
        oppsNew,
        oppsScored,
        totalCostUsd,
        errorSummary,
        logs,
      })
      .where(eq(schema.cronRuns.id, cronRunId))
      .run();
  }

  return { cronRunId, status, oppsFetched, oppsNew, oppsScored, totalCostUsd, errorSummary, triageAdvanced, projectedSonnetCostUsd, descFetchFailed };
}
