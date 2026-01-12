import { NextRequest, NextResponse } from 'next/server';
import { scoreOpportunity } from '@/lib/openai';
import { getCompanyProfile } from '@/lib/storage';
import type { SamOpportunity } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const opportunity: SamOpportunity = body.opportunity;
    
    if (!opportunity || !opportunity.noticeId) {
      return NextResponse.json(
        { error: 'Opportunity data is required' },
        { status: 400 }
      );
    }
    
    // Get company profile
    const companyProfile = await getCompanyProfile();
    
    if (!companyProfile) {
      return NextResponse.json(
        { 
          error: 'Company Profile Required',
          message: 'Please set up your company profile before scoring opportunities'
        },
        { status: 400 }
      );
    }
    
    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error: 'API Key Not Configured',
          message: 'Please set the OPENAI_API_KEY environment variable'
        },
        { status: 503 }
      );
    }
    
    const score = await scoreOpportunity(opportunity, companyProfile);
    
    return NextResponse.json(score);
  } catch (error) {
    console.error('Error scoring opportunity:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { error: 'Failed to score opportunity', message: errorMessage },
      { status: 500 }
    );
  }
}
