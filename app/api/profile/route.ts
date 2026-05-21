import { NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db, schema } from '@/lib/db/client';

const ProfileInput = z.object({
  name: z.string().min(1),
  uei: z.string().min(1),
  cageCode: z.string().nullish(),
  naicsCodes: z.array(z.string().regex(/^\d{6}$/)).min(1),
  certifications: z.array(z.string()),
  capabilities: z.string().min(1),
  contactName: z.string().min(1),
  contactEmail: z.string().email(),
  contactPhone: z.string().nullish(),
});

export async function GET() {
  const row = db.select().from(schema.companyProfile).where(eq(schema.companyProfile.id, 1)).get();
  if (!row) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json(row);
}

export async function PUT(req: Request) {
  const raw = await req.json().catch(() => null);
  const parsed = ProfileInput.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid', issues: parsed.error.issues }, { status: 400 });
  }
  const input = parsed.data;
  const existing = db.select().from(schema.companyProfile).where(eq(schema.companyProfile.id, 1)).get();
  const now = new Date();

  if (!existing) {
    const inserted = db
      .insert(schema.companyProfile)
      .values({ id: 1, version: 1, updatedAt: now, ...input })
      .returning()
      .get();
    return NextResponse.json(inserted);
  }
  const updated = db
    .update(schema.companyProfile)
    .set({ ...input, version: existing.version + 1, updatedAt: now })
    .where(eq(schema.companyProfile.id, 1))
    .returning()
    .get();
  return NextResponse.json(updated);
}
