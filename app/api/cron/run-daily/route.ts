import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { config } from '@/lib/config';
import { db } from '@/lib/db/client';
import { runDaily } from '@/lib/pipeline/daily-run';

function secretsMatch(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export async function POST(req: Request) {
  const provided = req.headers.get('x-cron-secret') ?? '';
  if (!secretsMatch(provided, config.cronSecret)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const summary = await runDaily({ db, costCapUsd: config.dailyCostCapUsd });
  return NextResponse.json(summary);
}
