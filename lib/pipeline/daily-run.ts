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

// SAM's search API returns `description` as a URL to a separate endpoint, not the text itself.
// Resolve it to the real description (once) before scoring, and persist so we never re-fetch.
async function resolveDescription(
  db: DB,
  opp: schema.Opportunity,
  log: LogFn,
): Promise<schema.Opportunity> {
  const desc = opp.description ?? '';
  if (!desc.startsWith('https://api.sam.gov')) return opp;
  const resolved = await fetchSamDescription(desc);
  if (!resolved) {
    log('warn', 'Description URL did not resolve; scoring on metadata only', { noticeId: opp.noticeId });
    return opp;
  }
  db.update(schema.opportunities)
    .set({ description: resolved })
    .where(eq(schema.opportunities.noticeId, opp.noticeId))
    .run();
  return { ...opp, description: resolved };
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

  // Reap stale runs a prior crash left stuck at 'running' (single-machine invariant: only this run should be active).
  db.update(schema.cronRuns)
    .set({ status: 'failed', errorSummary: 'reaped: stale running run (process died before finalize)', finishedAt: new Date() })
    .where(and(eq(schema.cronRuns.status, 'running'), ne(schema.cronRuns.id, cronRunId)))
    .run();

  let oppsFetched = 0;
  let oppsNew = 0;
  let oppsScored = 0;
  let totalCostUsd = 0;
  let status: RunSummary['status'] = 'ok';
  let errorSummary: string | null = null;
  let triageAdvanced = 0;
  let projectedSonnetCostUsd = 0;

  try {
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
    const alreadyScoredIds = new Set(
      db
        .select({ id: schema.scores.opportunityId })
        .from(schema.scores)
        .where(eq(schema.scores.profileVersion, profile.version))
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
        const oppForScoring = await resolveDescription(db, opp, log);
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

  return { cronRunId, status, oppsFetched, oppsNew, oppsScored, totalCostUsd, errorSummary, triageAdvanced, projectedSonnetCostUsd };
}
