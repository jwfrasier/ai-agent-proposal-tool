import { eq, desc } from 'drizzle-orm';
import type { DB } from '../db/client';
import * as schema from '../db/schema';
import { searchByProfile } from '../sam/search';
import { scoreOpportunity } from '../ai/score';
import { rankCandidates } from './heuristic';
import { log as rootLog } from '../log';
import type { SamOpportunityRaw } from '../sam/schemas';

export interface RunDailyArgs {
  db: DB;
  costCapUsd: number;
  topN?: number;
  postedFromOverride?: string;
}

export interface RunSummary {
  cronRunId: number;
  status: 'ok' | 'partial' | 'failed';
  oppsFetched: number;
  oppsNew: number;
  oppsScored: number;
  totalCostUsd: number;
  errorSummary: string | null;
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
  const { db, costCapUsd, topN = 10 } = args;
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

  try {
    const profile = db.select().from(schema.companyProfile).where(eq(schema.companyProfile.id, 1)).get();
    if (!profile) throw new Error('No company profile configured');

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

    log('info', 'Searching SAM', { postedFrom, naics: profile.naicsCodes });
    const samOpps = await searchByProfile({
      naicsCodes: profile.naicsCodes,
      postedFrom,
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
    const eligible = allOpps.filter((o) => !alreadyScoredIds.has(o.noticeId));
    const ranked = rankCandidates(eligible, profile).slice(0, topN);
    log('info', 'Ranked candidates', { eligible: eligible.length, taking: ranked.length });

    let lastCostUsd = 0;
    for (const opp of ranked) {
      if (totalCostUsd + lastCostUsd >= costCapUsd) {
        log('warn', 'Cost cap reached, stopping', { totalCostUsd, costCapUsd });
        status = 'partial';
        break;
      }
      try {
        const scored = await scoreOpportunity(opp, profile);
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
          model: scored.model,
          promptTokens: scored.promptTokens,
          completionTokens: scored.completionTokens,
          costUsd: scored.costUsd,
          createdAt: new Date(),
        }).run();
        totalCostUsd += scored.costUsd;
        lastCostUsd = scored.costUsd;
        oppsScored++;
        log('info', 'Scored', { noticeId: opp.noticeId, fit: scored.fitScore, costUsd: scored.costUsd });
      } catch (err) {
        log('error', 'Scoring failed', { noticeId: opp.noticeId, err: String(err) });
        status = status === 'ok' ? 'partial' : status;
      }
    }
  } catch (err) {
    status = 'failed';
    errorSummary = String(err);
    log('error', 'Run failed', { err: errorSummary });
  }

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

  return { cronRunId, status, oppsFetched, oppsNew, oppsScored, totalCostUsd, errorSummary };
}
