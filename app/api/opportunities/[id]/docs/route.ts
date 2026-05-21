import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import path from 'node:path';
import fs from 'node:fs/promises';
import { z } from 'zod';
import { db, schema } from '@/lib/db/client';
import { generateDoc } from '@/lib/ai/docs';
import { renderMarkdownToPdf } from '@/lib/docs/render';

const Body = z.object({
  kind: z.enum(['capability', 'analysis', 'proposal', 'compliance_matrix']),
});

const OUT_DIR = () => process.env.PDF_OUTPUT_DIR ?? path.join(process.cwd(), 'data', 'pdfs');

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const opp = db.select().from(schema.opportunities).where(eq(schema.opportunities.noticeId, id)).get();
  if (!opp) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const profile = db.select().from(schema.companyProfile).where(eq(schema.companyProfile.id, 1)).get();
  if (!profile) return NextResponse.json({ error: 'no_profile' }, { status: 400 });

  const out = await generateDoc(parsed.data.kind, opp, profile);
  const pdf = await renderMarkdownToPdf(out.markdown);

  const outDir = OUT_DIR();
  await fs.mkdir(outDir, { recursive: true });
  const filename = `${id}-${parsed.data.kind}-${Date.now()}.pdf`;
  const pdfPath = path.join(outDir, filename);
  await fs.writeFile(pdfPath, pdf);

  const inserted = db.insert(schema.documents).values({
    opportunityId: id,
    kind: parsed.data.kind,
    markdownSource: out.markdown,
    pdfPath,
    model: out.model,
    promptTokens: out.promptTokens,
    completionTokens: out.completionTokens,
    costUsd: out.costUsd,
    createdAt: new Date(),
  }).returning().get();

  return NextResponse.json(inserted);
}
