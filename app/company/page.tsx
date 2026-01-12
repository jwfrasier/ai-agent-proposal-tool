'use client';

import { useEffect, useState } from 'react';
import { CompanyProfileForm } from '@/components/CompanyProfileForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import type { CompanyProfile } from '@/types';

export default function CompanyPage() {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/company');
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data: CompanyProfile) => {
    const response = await fetch('/api/company', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      const savedProfile = await response.json();
      setProfile(savedProfile);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      throw new Error('Failed to save profile');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
            <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Company Profile</h1>
              <p className="text-muted-foreground">
                Configure your company details for opportunity matching and PDF generation
              </p>
            </div>
          </div>
          {saved && (
            <div className="flex items-center gap-2 text-emerald-600 animate-in fade-in">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Saved!</span>
            </div>
          )}
        </div>

        {/* Form */}
        <CompanyProfileForm initialData={profile} onSave={handleSave} />
      </div>
    </div>
  );
}
