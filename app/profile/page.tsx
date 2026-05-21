import { db, schema } from '@/lib/db/client';
import { eq } from 'drizzle-orm';
import { ProfileEditor } from '@/components/ProfileEditor';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const row = db.select().from(schema.companyProfile).where(eq(schema.companyProfile.id, 1)).get();
  const initial = row
    ? {
        name: row.name,
        uei: row.uei,
        cageCode: row.cageCode ?? '',
        naicsCodes: row.naicsCodes.join(', '),
        certifications: row.certifications.join(', '),
        capabilities: row.capabilities,
        contactName: row.contactName,
        contactEmail: row.contactEmail,
        contactPhone: row.contactPhone ?? '',
      }
    : {};
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Company profile</h1>
        <p className="text-sm text-muted-foreground">Editing bumps profile_version. Existing scores remain but will be flagged stale.</p>
      </header>
      <ProfileEditor initial={initial} />
    </div>
  );
}
