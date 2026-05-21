'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type ProfileForm = {
  name: string;
  uei: string;
  cageCode: string;
  naicsCodes: string;
  certifications: string;
  capabilities: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
};

export function ProfileEditor({ initial }: { initial: Partial<ProfileForm> }) {
  const [form, setForm] = useState<ProfileForm>({
    name: '', uei: '', cageCode: '', naicsCodes: '', certifications: '',
    capabilities: '', contactName: '', contactEmail: '', contactPhone: '',
    ...initial,
  });
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setStatus('saving'); setError(null);
    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ...form,
        naicsCodes: form.naicsCodes.split(',').map((s) => s.trim()).filter(Boolean),
        certifications: form.certifications.split(',').map((s) => s.trim()).filter(Boolean),
        cageCode: form.cageCode || null,
        contactPhone: form.contactPhone || null,
      }),
    });
    if (!res.ok) {
      setStatus('error');
      setError((await res.text()).slice(0, 300));
      return;
    }
    setStatus('saved');
  }

  function field<K extends keyof ProfileForm>(k: K) {
    return { value: form[k], onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value }) };
  }

  return (
    <div className="space-y-4">
      <Input placeholder="Company name" {...field('name')} />
      <div className="grid grid-cols-2 gap-3">
        <Input placeholder="UEI" {...field('uei')} />
        <Input placeholder="CAGE code (optional)" {...field('cageCode')} />
      </div>
      <Input placeholder="NAICS codes (comma-separated, 6-digit)" {...field('naicsCodes')} />
      <Input placeholder="Certifications (comma-separated: SB, WOSB, ...)" {...field('certifications')} />
      <Textarea rows={6} placeholder="Capabilities" {...field('capabilities')} />
      <div className="grid grid-cols-2 gap-3">
        <Input placeholder="Contact name" {...field('contactName')} />
        <Input placeholder="Contact email" type="email" {...field('contactEmail')} />
      </div>
      <Input placeholder="Contact phone (optional)" {...field('contactPhone')} />
      <Button onClick={save} disabled={status === 'saving'}>
        {status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved ✓' : 'Save profile'}
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
