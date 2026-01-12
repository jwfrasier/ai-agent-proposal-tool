import { NextRequest, NextResponse } from 'next/server';
import { getCompanyProfile, saveCompanyProfile } from '@/lib/storage';
import type { CompanyProfile } from '@/types';

export async function GET() {
  try {
    const profile = await getCompanyProfile();
    
    if (!profile) {
      return NextResponse.json(null, { status: 200 });
    }
    
    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching company profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch company profile' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.uei) {
      return NextResponse.json(
        { error: 'Company name and UEI are required' },
        { status: 400 }
      );
    }
    
    const profile: CompanyProfile = {
      id: body.id || crypto.randomUUID(),
      name: body.name,
      uei: body.uei,
      cageCode: body.cageCode || '',
      naicsCodes: body.naicsCodes || [],
      pscCodes: body.pscCodes || [],
      capabilities: body.capabilities || '',
      pastPerformance: body.pastPerformance || [],
      certifications: body.certifications || [],
      smallBusinessTypes: body.smallBusinessTypes || [],
      contactInfo: body.contactInfo || {
        address: '',
        city: '',
        state: '',
        zip: '',
        phone: '',
        email: '',
        website: '',
        pointOfContact: '',
        pocTitle: '',
      },
      coreCompetencies: body.coreCompetencies || [],
      differentiators: body.differentiators || '',
      yearsInBusiness: body.yearsInBusiness || 0,
      annualRevenue: body.annualRevenue || '',
      employeeCount: body.employeeCount || 0,
      updatedAt: new Date().toISOString(),
    };
    
    const saved = await saveCompanyProfile(profile);
    
    return NextResponse.json(saved, { status: 200 });
  } catch (error) {
    console.error('Error saving company profile:', error);
    return NextResponse.json(
      { error: 'Failed to save company profile' },
      { status: 500 }
    );
  }
}
