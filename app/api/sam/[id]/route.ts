import { NextRequest, NextResponse } from 'next/server';
import { getOpportunityById } from '@/lib/sam-api';
import { getOpportunityFromCache } from '@/lib/storage';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Opportunity ID is required' },
        { status: 400 }
      );
    }
    
    // First check if opportunity exists in cache
    const cachedOpportunity = await getOpportunityFromCache(id);
    if (cachedOpportunity) {
      console.log('Returning cached opportunity:', id);
      return NextResponse.json(cachedOpportunity);
    }
    
    // If not in cache, try to fetch from SAM.gov API
    const opportunity = await getOpportunityById(id);
    
    if (!opportunity) {
      return NextResponse.json(
        { error: 'Opportunity not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(opportunity);
  } catch (error) {
    console.error('Error fetching opportunity:', error);
    
    // If API fails, try cache as fallback
    const { id } = await params;
    const cachedOpportunity = await getOpportunityFromCache(id);
    if (cachedOpportunity) {
      console.log('API failed, returning cached opportunity:', id);
      return NextResponse.json(cachedOpportunity);
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch opportunity' },
      { status: 500 }
    );
  }
}
